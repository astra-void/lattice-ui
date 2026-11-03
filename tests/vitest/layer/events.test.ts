import { beforeEach, describe, expect, it, vi } from "vitest";

type LayerEventsModule = typeof import("../../../packages/react/layer/src/dismissable/events");

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

  vi.doMock("../../../packages/react/layer/src/internals/env", () => ({
    // A real top-bar inset: hit-testing must not depend on it.
    getGuiInsetTopLeft: () => new Vector2(0, 58),
  }));

  return import("../../../packages/react/layer/src/dismissable/events") as Promise<LayerEventsModule>;
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
  it("treats the content boundary itself as an inside hit", async () => {
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
      {},
    );

    expect(outside).toBe(false);
  });

  it("treats a hit on the boundary node itself as outside when boundaryMatchesSelf is false", async () => {
    // The internal fallback boundary is a full-screen positioning canvas that is
    // hit at every pointer position. With boundaryMatchesSelf disabled, landing
    // on the canvas itself must read as outside so outside clicks still dismiss.
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
        boundaryMatchesSelf: false,
      },
    );

    expect(outside).toBe(true);
  });

  it("still treats descendants of the boundary as inside when boundaryMatchesSelf is false", async () => {
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
        boundaryMatchesSelf: false,
      },
    );

    expect(outside).toBe(false);
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
      {},
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
      },
    );

    expect(insideHit).toBe(false);
    expect(outsideHit).toBe(true);
  });

  it("hit-tests only the pointer position, so a press just outside the content dismisses", async () => {
    // Regression (DEV-93): samples shifted by the 58px top-bar inset made a
    // press up to 58px above or below the content count as inside.
    const layerEvents = await loadLayerEvents();
    const contentWrapper = createGuiNode("ContentWrapper");
    const contentTop = 206;
    const contentBottom = 426;

    const container = {
      GetGuiObjectsAtPosition: vi.fn((_x: number, y: number) =>
        y >= contentTop && y <= contentBottom ? [contentWrapper] : [],
      ),
    } as unknown as BasePlayerGui;

    const pressAt = (y: number) =>
      layerEvents.isOutsidePointerEvent(
        { Position: { X: 700, Y: y }, UserInputType: Enum.UserInputType.MouseButton1 } as InputObject,
        container,
        contentWrapper as unknown as GuiObject,
        {},
      );

    expect(pressAt(contentTop - 30)).toBe(true);
    expect(pressAt(contentBottom + 30)).toBe(true);
    expect(pressAt(contentTop + 4)).toBe(false);
    expect(container.GetGuiObjectsAtPosition).toHaveBeenCalledTimes(3);
  });
});
