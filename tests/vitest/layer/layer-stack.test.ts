import { beforeEach, describe, expect, it, vi } from "vitest";

type DismissActionHandler = (actionName: string, inputState: unknown, inputObject: unknown) => unknown;

type LayerStackModule = typeof import("../../../packages/layer/src/dismissable/layerStack");

type LayerStackHarness = {
  layerStack: LayerStackModule;
  getFocusedTextBox: ReturnType<typeof vi.fn>;
  bindActionAtPriority: ReturnType<typeof vi.fn>;
  unbindAction: ReturnType<typeof vi.fn>;
  getDismissHandler: () => DismissActionHandler | undefined;
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

  let dismissHandler: DismissActionHandler | undefined;

  const bindActionAtPriority = vi.fn((actionName: string, callback: DismissActionHandler) => {
    if (actionName === "LatticeUiDismissLayerAction") {
      dismissHandler = callback;
    }
  });

  const unbindAction = vi.fn((actionName: string) => {
    if (actionName === "LatticeUiDismissLayerAction") {
      dismissHandler = undefined;
    }
  });

  const getFocusedTextBox = vi.fn(() => undefined);

  const inputConnections = new Set<(inputObject: unknown, gameProcessedEvent: boolean) => void>();

  vi.doMock("../../../packages/layer/src/internals/env", () => {
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
        GetFocusedTextBox: getFocusedTextBox,
      },
    };
  });

  const layerStack = await import("../../../packages/layer/src/dismissable/layerStack");

  return {
    layerStack,
    getFocusedTextBox,
    bindActionAtPriority,
    unbindAction,
    getDismissHandler: () => dismissHandler,
  };
}

beforeEach(() => {
  ensureArrayRemoveShim();

  Object.assign(globalThis as Record<string, unknown>, {
    Enum: {
      KeyCode: {
        Escape: "Escape",
        Backspace: "Backspace",
        ButtonB: "ButtonB",
      },
      UserInputType: {
        MouseButton1: "MouseButton1",
        Touch: "Touch",
      },
      UserInputState: {
        Begin: "Begin",
        End: "End",
        Cancel: "Cancel",
      },
      ContextActionResult: {
        Pass: "Pass",
        Sink: "Sink",
      },
      ContextActionPriority: {
        High: {
          Value: 3000,
        },
      },
    },
  });
});

describe("layerStack dismiss key handling", () => {
  it("sinks Backspace begin and release after dismiss", async () => {
    const harness = await createLayerStackHarness();

    let dismissCalls = 0;

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
      onDismiss: () => {
        dismissCalls += 1;
      },
    });

    const dismissHandler = harness.getDismissHandler();
    expect(dismissHandler).toBeTypeOf("function");

    const beginResult = dismissHandler?.(
      "LatticeUiDismissLayerAction",
      Enum.UserInputState.Begin,
      { KeyCode: Enum.KeyCode.Backspace },
    );

    expect(beginResult).toBe(Enum.ContextActionResult.Sink);
    expect(dismissCalls).toBe(1);

    harness.layerStack.unregisterLayer(registration.id);
    expect(harness.unbindAction).not.toHaveBeenCalled();

    const releaseResult = dismissHandler?.(
      "LatticeUiDismissLayerAction",
      Enum.UserInputState.End,
      { KeyCode: Enum.KeyCode.Backspace },
    );

    expect(releaseResult).toBe(Enum.ContextActionResult.Sink);
    expect(harness.unbindAction).toHaveBeenCalledWith("LatticeUiDismissLayerAction");
  });

  it("does not dismiss on Backspace while a textbox is focused", async () => {
    const harness = await createLayerStackHarness();

    let dismissCalls = 0;

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
      onDismiss: () => {
        dismissCalls += 1;
      },
    });

    harness.getFocusedTextBox.mockReturnValue({});

    const result = harness.getDismissHandler()?.(
      "LatticeUiDismissLayerAction",
      Enum.UserInputState.Begin,
      { KeyCode: Enum.KeyCode.Backspace },
    );

    expect(result).toBe(Enum.ContextActionResult.Pass);
    expect(dismissCalls).toBe(0);

    harness.layerStack.unregisterLayer(registration.id);
  });

  it("passes Escape through", async () => {
    const harness = await createLayerStackHarness();

    let dismissCalls = 0;

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
      onDismiss: () => {
        dismissCalls += 1;
      },
    });

    const result = harness.getDismissHandler()?.(
      "LatticeUiDismissLayerAction",
      Enum.UserInputState.Begin,
      { KeyCode: Enum.KeyCode.Escape },
    );

    expect(result).toBe(Enum.ContextActionResult.Pass);
    expect(dismissCalls).toBe(0);

    harness.layerStack.unregisterLayer(registration.id);
  });
});
