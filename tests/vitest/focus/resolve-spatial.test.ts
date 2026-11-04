import { beforeEach, describe, expect, it, vi } from "vitest";

// Spatial resolution and the scope escape chain: nearest-centre scoring with the
// cross-axis penalty, escaping a scope that has no target, trapped scopes
// stopping the walk, ordered wrap, and Tab order.

type FocusManagerModule = typeof import("../../../packages/react/focus/src/focusManager");

type MockGuiObject = GuiObject & { children: MockGuiObject[] };

type Rect = { x: number; y: number; w: number; h: number };

function createGuiObject(name: string, parent: MockGuiObject | undefined, rect: Rect, selectable = true) {
  const guiObject = {
    Name: name,
    Parent: parent,
    Visible: true,
    Selectable: selectable,
    LayoutOrder: 0,
    AbsolutePosition: new Vector2(rect.x, rect.y),
    AbsoluteSize: new Vector2(rect.w, rect.h),
    children: new Array<MockGuiObject>(),
    IsA(className: string) {
      return className === "GuiObject" || className === "Instance";
    },
    FindFirstChildWhichIsA() {
      return undefined;
    },
    IsDescendantOf(ancestor: Instance) {
      let current = this.Parent;
      while (current !== undefined) {
        if (current === ancestor) {
          return true;
        }
        current = current.Parent;
      }
      return false;
    },
    GetDescendants() {
      const descendants = new Array<Instance>();
      const walk = (current: MockGuiObject) => {
        for (const child of current.children) {
          descendants.push(child);
          walk(child);
        }
      };
      walk(this as MockGuiObject);
      return descendants;
    },
  } as unknown as MockGuiObject;

  parent?.children.push(guiObject);
  return guiObject;
}

async function loadFocusManager(): Promise<FocusManagerModule> {
  vi.resetModules();
  let selectedObject: unknown;
  vi.doMock("../../../packages/react/focus/src/env", () => ({
    GuiService: {
      get SelectedObject() {
        return selectedObject;
      },
      set SelectedObject(value: unknown) {
        selectedObject = value;
      },
      GetPropertyChangedSignal: () => ({ Connect: () => ({ Disconnect() {} }) }),
    },
  }));
  return import("../../../packages/react/focus/src/focusManager");
}

function createMountRoot() {
  const mountRoot = createGuiObject("mount-root", undefined, { x: 0, y: 0, w: 1000, h: 1000 }, false);
  mountRoot.Parent = {
    Parent: undefined,
    Enabled: true,
    IsA: (className: string) => className === "LayerCollector" || className === "Instance",
  } as unknown as Instance;
  return mountRoot;
}

function registerScope(
  focusManager: FocusManagerModule,
  root: GuiObject,
  options: {
    parentScopeId?: number;
    trapped?: boolean;
    strategy?: "ordered" | "spatial";
    orientation?: "vertical" | "horizontal";
    wrap?: boolean;
  } = {},
) {
  const scopeId = focusManager.createFocusScopeId();
  focusManager.registerFocusScope(scopeId, {
    parentScopeId: options.parentScopeId,
    getRoot: () => root,
    getActive: () => true,
    getTrapped: () => options.trapped === true,
    getNavStrategy: () => options.strategy ?? "spatial",
    getNavOrientation: () => options.orientation ?? "vertical",
    getNavWrap: () => options.wrap === true,
  });
  return scopeId;
}

function registerNode(focusManager: FocusManagerModule, scopeId: number, guiObject: GuiObject) {
  return focusManager.registerFocusNode({ scopeId, getGuiObject: () => guiObject });
}

function move(focusManager: FocusManagerModule, direction: "up" | "down" | "left" | "right") {
  return focusManager.resolveNavigation({ type: "move", direction })?.guiObject;
}

beforeEach(() => {
  vi.resetModules();
});

describe("spatial resolution", () => {
  it("moves to the nearest node in each direction of a grid", async () => {
    const focusManager = await loadFocusManager();
    const mountRoot = createMountRoot();
    const scopeId = registerScope(focusManager, mountRoot);

    // A plus shape around a centre node.
    const center = createGuiObject("center", mountRoot, { x: 200, y: 200, w: 50, h: 50 });
    const right = createGuiObject("right", mountRoot, { x: 300, y: 200, w: 50, h: 50 });
    const farRight = createGuiObject("far-right", mountRoot, { x: 500, y: 200, w: 50, h: 50 });
    const left = createGuiObject("left", mountRoot, { x: 100, y: 200, w: 50, h: 50 });
    const up = createGuiObject("up", mountRoot, { x: 200, y: 100, w: 50, h: 50 });
    const down = createGuiObject("down", mountRoot, { x: 200, y: 300, w: 50, h: 50 });

    const centerId = registerNode(focusManager, scopeId, center);
    for (const guiObject of [right, farRight, left, up, down]) {
      registerNode(focusManager, scopeId, guiObject);
    }

    focusManager.focusNode(centerId);

    expect(move(focusManager, "right")).toBe(right);
    expect(move(focusManager, "left")).toBe(left);
    expect(move(focusManager, "up")).toBe(up);
    expect(move(focusManager, "down")).toBe(down);
  });

  it("prefers an in-line node over a closer one far off the axis", async () => {
    const focusManager = await loadFocusManager();
    const mountRoot = createMountRoot();
    const scopeId = registerScope(focusManager, mountRoot);

    const origin = createGuiObject("origin", mountRoot, { x: 0, y: 200, w: 50, h: 50 });
    // 100px along and 150px across scores 100 + 150 * 2 = 400.
    const offAxis = createGuiObject("off-axis", mountRoot, { x: 100, y: 350, w: 50, h: 50 });
    // 300px along and in line scores 300.
    const inLine = createGuiObject("in-line", mountRoot, { x: 300, y: 200, w: 50, h: 50 });

    const originId = registerNode(focusManager, scopeId, origin);
    registerNode(focusManager, scopeId, offAxis);
    registerNode(focusManager, scopeId, inLine);

    focusManager.focusNode(originId);

    expect(move(focusManager, "right")).toBe(inLine);
  });

  it("returns nothing when no node lies in the pressed direction", async () => {
    const focusManager = await loadFocusManager();
    const mountRoot = createMountRoot();
    const scopeId = registerScope(focusManager, mountRoot);

    const only = createGuiObject("only", mountRoot, { x: 0, y: 0, w: 50, h: 50 });
    const below = createGuiObject("below", mountRoot, { x: 0, y: 100, w: 50, h: 50 });
    const onlyId = registerNode(focusManager, scopeId, only);
    registerNode(focusManager, scopeId, below);

    focusManager.focusNode(onlyId);

    expect(move(focusManager, "up")).toBeUndefined();
    expect(move(focusManager, "left")).toBeUndefined();
  });
});

describe("scope escape chain", () => {
  function buildNested(focusManager: FocusManagerModule, innerTrapped: boolean) {
    const mountRoot = createMountRoot();
    const parentScopeId = registerScope(focusManager, mountRoot);

    // A horizontal toolbar scope above a button that belongs to the parent.
    const toolbar = createGuiObject("toolbar", mountRoot, { x: 0, y: 0, w: 400, h: 50 }, false);
    const first = createGuiObject("first", toolbar, { x: 0, y: 0, w: 100, h: 50 });
    const second = createGuiObject("second", toolbar, { x: 150, y: 0, w: 100, h: 50 });
    const below = createGuiObject("below", mountRoot, { x: 0, y: 200, w: 100, h: 50 });

    const toolbarScopeId = registerScope(focusManager, toolbar, { parentScopeId, trapped: innerTrapped });
    const firstId = registerNode(focusManager, toolbarScopeId, first);
    registerNode(focusManager, toolbarScopeId, second);
    registerNode(focusManager, parentScopeId, below);

    focusManager.focusNode(firstId);
    return { second, below };
  }

  it("escapes to the parent scope when the inner scope has no target", async () => {
    const focusManager = await loadFocusManager();
    const { second, below } = buildNested(focusManager, false);

    expect(move(focusManager, "right")).toBe(second);
    expect(move(focusManager, "down")).toBe(below);
  });

  it("stops at a trapped scope instead of escaping", async () => {
    const focusManager = await loadFocusManager();
    const { second } = buildNested(focusManager, true);

    expect(move(focusManager, "right")).toBe(second);
    expect(move(focusManager, "down")).toBeUndefined();
  });
});

describe("ordered scopes", () => {
  function buildList(focusManager: FocusManagerModule, wrap: boolean) {
    const mountRoot = createMountRoot();
    const list = createGuiObject("list", mountRoot, { x: 0, y: 0, w: 200, h: 120 }, false);
    const items = [0, 1, 2].map((index) => {
      const item = createGuiObject(`item-${index}`, list, { x: 0, y: index * 40, w: 200, h: 40 });
      item.LayoutOrder = index;
      return item;
    });

    const scopeId = registerScope(focusManager, list, { strategy: "ordered", orientation: "vertical", wrap });
    const ids = items.map((item) => registerNode(focusManager, scopeId, item));
    return { items, ids };
  }

  it("wraps from the last item to the first when navWrap is on", async () => {
    const focusManager = await loadFocusManager();
    const { items, ids } = buildList(focusManager, true);

    focusManager.focusNode(ids[2]);
    expect(move(focusManager, "down")).toBe(items[0]);

    focusManager.focusNode(ids[0]);
    expect(move(focusManager, "up")).toBe(items[2]);
  });

  it("stops at the ends when navWrap is off", async () => {
    const focusManager = await loadFocusManager();
    const { ids } = buildList(focusManager, false);

    focusManager.focusNode(ids[2]);
    expect(move(focusManager, "down")).toBeUndefined();
  });

  it("cycles Tab and Shift+Tab through every node, wrapping at both ends", async () => {
    const focusManager = await loadFocusManager();
    const { items, ids } = buildList(focusManager, false);

    focusManager.focusNode(ids[1]);
    expect(focusManager.resolveNavigation({ type: "next" })?.guiObject).toBe(items[2]);
    expect(focusManager.resolveNavigation({ type: "prev" })?.guiObject).toBe(items[0]);

    focusManager.focusNode(ids[2]);
    expect(focusManager.resolveNavigation({ type: "next" })?.guiObject).toBe(items[0]);
  });
});
