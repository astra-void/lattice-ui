import { beforeEach, describe, expect, it, vi } from "vitest";

type LayerEventsModule = typeof import("../../../packages/layer/src/dismissable/events");

type GuiNode = {
  Name: string;
  parent?: GuiNode;
  IsDescendantOf: (ancestor: GuiNode) => boolean;
};

function createGuiNode(name: string, parent?: GuiNode): GuiNode {
  return {
    Name: name,
    parent,
    IsDescendantOf(ancestor) {
      let current = this.parent;
      while (current) {
        if (current === ancestor) {
          return true;
        }

        current = current.parent;
      }

      return false;
    },
  };
}

async function loadLayerEvents() {
  vi.resetModules();

  vi.doMock("../../../packages/layer/src/internals/env", () => ({
    getGuiInsetTopLeft: () => new Vector2(0, 0),
  }));

  return import("../../../packages/layer/src/dismissable/events") as Promise<LayerEventsModule>;
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).Enum = {
    UserInputType: {
      MouseButton1: "MouseButton1",
      Touch: "Touch",
    },
  };
});

describe("dismissable layer outside pointer detection", () => {
  it("treats the fullscreen content wrapper itself as outside", async () => {
    const layerEvents = await loadLayerEvents();

    const contentWrapper = createGuiNode("ContentWrapper");

    const container = {
      GetGuiObjectsAtPosition: vi.fn(() => [contentWrapper]),
    } as unknown as BasePlayerGui;

    const outside = layerEvents.isOutsidePointerEvent(
      {
        Position: { X: 120, Y: 88 },
        UserInputType: Enum.UserInputType.MouseButton1,
      } as InputObject,
      container,
      contentWrapper as unknown as GuiObject,
      {
        layerIgnoresGuiInset: false,
      },
    );

    expect(outside).toBe(true);
  });

  it("treats descendants of the content wrapper as inside hits", async () => {
    const layerEvents = await loadLayerEvents();

    const contentWrapper = createGuiNode("ContentWrapper");
    const contentChild = createGuiNode("ContentChild", contentWrapper);

    const container = {
      GetGuiObjectsAtPosition: vi.fn(() => [contentChild]),
    } as unknown as BasePlayerGui;

    const outside = layerEvents.isOutsidePointerEvent(
      {
        Position: { X: 120, Y: 88 },
        UserInputType: Enum.UserInputType.MouseButton1,
      } as InputObject,
      container,
      contentWrapper as unknown as GuiObject,
      {
        layerIgnoresGuiInset: false,
      },
    );

    expect(outside).toBe(false);
  });

  it("treats additional inside roots as part of the interaction boundary", async () => {
    const layerEvents = await loadLayerEvents();

    const contentWrapper = createGuiNode("ContentWrapper");
    const triggerRoot = createGuiNode("TriggerRoot");
    const inputRoot = createGuiNode("InputRoot");

    const container = {
      GetGuiObjectsAtPosition: vi.fn(() => [inputRoot]),
    } as unknown as BasePlayerGui;

    const outside = layerEvents.isOutsidePointerEvent(
      {
        Position: { X: 120, Y: 88 },
        UserInputType: Enum.UserInputType.MouseButton1,
      } as InputObject,
      container,
      contentWrapper as unknown as GuiObject,
      {
        insideRoots: [triggerRoot as unknown as GuiObject, inputRoot as unknown as GuiObject],
        layerIgnoresGuiInset: false,
      },
    );

    expect(outside).toBe(false);
  });

  it("treats descendants of additional inside roots as inside hits", async () => {
    const layerEvents = await loadLayerEvents();

    const contentWrapper = createGuiNode("ContentWrapper");
    const triggerRoot = createGuiNode("TriggerRoot");
    const triggerChild = createGuiNode("TriggerChild", triggerRoot);
    const outsideRoot = createGuiNode("OutsideRoot");

    const container = {
      GetGuiObjectsAtPosition: vi.fn().mockReturnValueOnce([triggerChild]).mockReturnValueOnce([outsideRoot]),
    } as unknown as BasePlayerGui;

    const insideHit = layerEvents.isOutsidePointerEvent(
      {
        Position: { X: 20, Y: 20 },
        UserInputType: Enum.UserInputType.MouseButton1,
      } as InputObject,
      container,
      contentWrapper as unknown as GuiObject,
      {
        insideRoots: [triggerRoot as unknown as GuiObject],
        layerIgnoresGuiInset: false,
      },
    );

    const outsideHit = layerEvents.isOutsidePointerEvent(
      {
        Position: { X: 40, Y: 40 },
        UserInputType: Enum.UserInputType.MouseButton1,
      } as InputObject,
      container,
      contentWrapper as unknown as GuiObject,
      {
        insideRoots: [triggerRoot as unknown as GuiObject],
        layerIgnoresGuiInset: false,
      },
    );

    expect(insideHit).toBe(false);
    expect(outsideHit).toBe(true);
  });
});
