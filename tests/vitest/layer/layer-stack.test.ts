import { beforeEach, describe, expect, it, vi } from "vitest";

type LayerStackModule = typeof import("../../../packages/layer/src/dismissable/layerStack");

type LayerStackHarness = {
  layerStack: LayerStackModule;
  bindActionAtPriority: ReturnType<typeof vi.fn>;
  unbindAction: ReturnType<typeof vi.fn>;
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
      },
    };
  });

  const layerStack = await import("../../../packages/layer/src/dismissable/layerStack");

  return {
    layerStack,
    bindActionAtPriority,
    unbindAction,
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
    },
  });
});

describe("layerStack dismiss key handling", () => {
  it("does not bind a dismiss action when layers register", async () => {
    const harness = await createLayerStackHarness();

    const registration = harness.layerStack.registerLayer({
      getEnabled: () => true,
      isPointerOutside: () => false,
    });

    expect(harness.bindActionAtPriority).not.toHaveBeenCalled();
    expect(harness.unbindAction).not.toHaveBeenCalled();

    harness.layerStack.unregisterLayer(registration.id);
    expect(harness.unbindAction).not.toHaveBeenCalled();
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

  it("ignores processed pointer input for outside dismiss", async () => {
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

    expect(dismissCalls).toBe(0);

    harness.layerStack.unregisterLayer(registration.id);
  });
});
