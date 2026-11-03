import { beforeEach, describe, expect, it, vi } from "vitest";

type LayerStackModule = typeof import("../../../packages/react/layer/src/dismissable/layerStack");

type LayerStackHarness = {
  layerStack: LayerStackModule;
  bindActionAtPriority: ReturnType<typeof vi.fn>;
  unbindAction: ReturnType<typeof vi.fn>;
  focusedTextBox: { current: unknown };
  pressDismissKey: (inputState: string, keyCode?: string) => unknown;
  emitInputBegan: (inputObject: unknown, gameProcessedEvent?: boolean) => void;
};

function ensureArrayRemoveShim() {
  const arrayProto = Array.prototype as unknown as { remove?: (index: number) => unknown };
  if (arrayProto.remove !== undefined) {
    return;
  }

  Object.defineProperty(arrayProto, "remove", {
    value(index: number) {
      return (this as Array<unknown>).splice(index, 1)[0];
    },
    configurable: true,
    writable: true,
  });
}

async function createLayerStackHarness(): Promise<LayerStackHarness> {
  vi.resetModules();

  const bindActionAtPriority = vi.fn();
  const unbindAction = vi.fn();

  const focusedTextBox: { current: unknown } = { current: undefined };
  const inputConnections = new Set<(inputObject: unknown, gameProcessedEvent: boolean) => void>();

  vi.doMock("../../../packages/react/layer/src/internals/env", () => {
    let selectedObject: unknown;

    return {
      ContextActionService: {
        BindActionAtPriority: bindActionAtPriority,
        UnbindAction: unbindAction,
      },
      GuiService: {
        get SelectedObject() {
          return selectedObject;
        },
        set SelectedObject(value: unknown) {
          selectedObject = value;
        },
      },
      UserInputService: {
        GetFocusedTextBox: () => focusedTextBox.current,
        InputBegan: {
          Connect(callback: (inputObject: unknown, gameProcessedEvent: boolean) => void) {
            inputConnections.add(callback);
            return {
              Disconnect() {
                inputConnections.delete(callback);
              },
            };
          },
        },
      },
    };
  });

  const layerStack = await import("../../../packages/react/layer/src/dismissable/layerStack");

  return {
    layerStack,
    bindActionAtPriority,
    unbindAction,
    focusedTextBox,
    pressDismissKey: (inputState: string, keyCode = "ButtonB") => {
      const handler = bindActionAtPriority.mock.calls.at(-1)?.[1] as
        | ((actionName: string, inputState: string, inputObject: unknown) => unknown)
        | undefined;
      return handler?.("LatticeUiDismissLayer", inputState, { KeyCode: keyCode });
    },
    emitInputBegan: (inputObject, gameProcessedEvent = false) => {
      for (const callback of inputConnections) {
        callback(inputObject, gameProcessedEvent);
      }
    },
  };
}

beforeEach(() => {
  ensureArrayRemoveShim();

  Object.assign(globalThis as Record<string, unknown>, {
    Enum: {
      UserInputType: {
        MouseButton1: "MouseButton1",
        Touch: "Touch",
      },
      KeyCode: { ButtonB: "ButtonB", Backspace: "Backspace" },
      UserInputState: { Begin: "Begin", End: "End", Cancel: "Cancel" },
      ContextActionResult: { Sink: "Sink", Pass: "Pass" },
    },
  });
});

describe("layerStack dismiss key handling", () => {
  it("binds the dismiss keys while a layer is registered and unbinds after", async () => {
    const harness = await createLayerStackHarness();

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
    });

    expect(harness.bindActionAtPriority).toHaveBeenCalledTimes(1);
    expect(harness.bindActionAtPriority.mock.calls[0].slice(4)).toEqual(["ButtonB", "Backspace"]);

    harness.layerStack.unregisterLayer(registration.id);
    expect(harness.unbindAction).toHaveBeenCalledTimes(1);
  });

  it("dismisses the top-most enabled layer on the dismiss key and sinks the press", async () => {
    const harness = await createLayerStackHarness();
    const dismissed: string[] = [];

    const lower = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
      onDismiss: () => dismissed.push("lower"),
    });
    const upper = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
      onDismiss: () => dismissed.push("upper"),
    });

    expect(harness.pressDismissKey("Begin")).toBe("Sink");
    expect(harness.pressDismissKey("End")).toBe("Sink");
    expect(dismissed).toEqual(["upper"]);

    harness.layerStack.unregisterLayer(upper.id);
    harness.layerStack.unregisterLayer(lower.id);
  });

  it("lets onEscapeKeyDown prevent the dismissal", async () => {
    const harness = await createLayerStackHarness();
    const onDismiss = vi.fn();

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
      onEscapeKeyDown: (event) => event.preventDefault(),
      onDismiss,
    });

    harness.pressDismissKey("Begin");
    expect(onDismiss).not.toHaveBeenCalled();

    harness.layerStack.unregisterLayer(registration.id);
  });

  it("passes the dismiss key through when no layer is enabled or a TextBox is focused", async () => {
    const harness = await createLayerStackHarness();
    const onDismiss = vi.fn();
    let enabled = false;

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => enabled,
      isPointerOutside: () => false,
      onDismiss,
    });

    expect(harness.pressDismissKey("Begin")).toBe("Pass");

    enabled = true;
    harness.focusedTextBox.current = {};
    expect(harness.pressDismissKey("Begin", "Backspace")).toBe("Pass");
    expect(onDismiss).not.toHaveBeenCalled();

    harness.layerStack.unregisterLayer(registration.id);
  });

  it("keeps sinking a dismiss key until release when its layer unmounts on press", async () => {
    const harness = await createLayerStackHarness();
    let registrationId = 0;

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
      onDismiss: () => harness.layerStack.unregisterLayer(registrationId),
    });
    registrationId = registration.id;

    expect(harness.pressDismissKey("Begin")).toBe("Sink");
    expect(harness.unbindAction).not.toHaveBeenCalled();

    expect(harness.pressDismissKey("End")).toBe("Sink");
    expect(harness.unbindAction).toHaveBeenCalledTimes(1);
  });

  it("only dismisses on pointer input when the hit is outside", async () => {
    const harness = await createLayerStackHarness();

    let dismissCalls = 0;

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: (inputObject) => (inputObject as { outside?: boolean }).outside === true,
      onDismiss: () => {
        dismissCalls += 1;
      },
    });

    harness.emitInputBegan({
      UserInputType: Enum.UserInputType.MouseButton1,
      outside: false,
    });

    expect(dismissCalls).toBe(0);

    harness.emitInputBegan({
      UserInputType: Enum.UserInputType.MouseButton1,
      outside: true,
    });

    expect(dismissCalls).toBe(1);

    harness.layerStack.unregisterLayer(registration.id);
  });

  it("dismisses on game-processed pointer input when the hit is outside", async () => {
    // Roblox marks presses sunk by Active GUI elements (including the layer's
    // own modal blocker and any other on-screen button) as game-processed;
    // those are exactly the presses that must still dismiss.
    const harness = await createLayerStackHarness();

    let dismissCalls = 0;

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => true,
      onDismiss: () => {
        dismissCalls += 1;
      },
    });

    harness.emitInputBegan(
      {
        UserInputType: Enum.UserInputType.MouseButton1,
      },
      true,
    );

    expect(dismissCalls).toBe(1);

    harness.layerStack.unregisterLayer(registration.id);
  });

  it("does not dismiss on game-processed pointer input when the hit is inside", async () => {
    const harness = await createLayerStackHarness();

    let dismissCalls = 0;

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
      onDismiss: () => {
        dismissCalls += 1;
      },
    });

    harness.emitInputBegan(
      {
        UserInputType: Enum.UserInputType.MouseButton1,
      },
      true,
    );

    expect(dismissCalls).toBe(0);

    harness.layerStack.unregisterLayer(registration.id);
  });
});

describe("layerStack open-order", () => {
  it("dismisses the most recently promoted layer, not the last mounted one", async () => {
    const harness = await createLayerStackHarness();

    const dismissed: string[] = [];

    const first = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => true,
      onDismiss: () => {
        dismissed.push("first");
      },
    });
    const second = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => true,
      onDismiss: () => {
        dismissed.push("second");
      },
    });

    // Without promotion the last registered layer is topmost.
    harness.emitInputBegan({ UserInputType: Enum.UserInputType.MouseButton1 });
    expect(dismissed).toEqual(["second"]);

    // Promote the first layer (it re-opened): it must now be topmost.
    harness.layerStack.promoteLayer(first.id);
    harness.emitInputBegan({ UserInputType: Enum.UserInputType.MouseButton1 });
    expect(dismissed).toEqual(["second", "first"]);

    harness.layerStack.unregisterLayer(first.id);
    harness.layerStack.unregisterLayer(second.id);
  });

  it("assigns a fresh, higher mount order when promoting a non-top layer", async () => {
    const harness = await createLayerStackHarness();

    const first = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
    });
    const second = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
    });

    const promoted = harness.layerStack.promoteLayer(first.id);
    expect(promoted).toBeDefined();
    expect(promoted!).toBeGreaterThan(second.mountOrder);

    // Promoting the already-topmost layer keeps its order stable.
    expect(harness.layerStack.promoteLayer(first.id)).toBe(promoted);

    // Unknown layers report undefined.
    expect(harness.layerStack.promoteLayer(9999)).toBeUndefined();

    harness.layerStack.unregisterLayer(first.id);
    harness.layerStack.unregisterLayer(second.id);
  });
});
