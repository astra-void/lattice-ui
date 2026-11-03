import { beforeEach, describe, expect, it, vi } from "vitest";

type FocusManagerModule = typeof import("../../../packages/react/focus/src/focusManager");

type MockGuiObject = GuiObject & { children: MockGuiObject[] };

function createGuiObject(
  name: string,
  parent: MockGuiObject | undefined,
  rect: { x: number; y: number; w: number; h: number },
  selectable = true,
) {
  const guiObject = {
    Name: name,
    Parent: parent,
    Visible: true,
    Selectable: selectable,
    AbsolutePosition: new Vector2(rect.x, rect.y),
    AbsoluteSize: new Vector2(rect.w, rect.h),
    children: new Array<MockGuiObject>(),
    IsA(className: string) {
      return className === "GuiObject" || className === "Instance";
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

beforeEach(() => {
  vi.resetModules();
});

describe("ordered scope cross-axis moves", () => {
  it("escape to the parent instead of landing on a wider sibling in the same list", async () => {
    const focusManager = await loadFocusManager();

    const mountRoot = createGuiObject("mount-root", undefined, { x: 0, y: 0, w: 1000, h: 1000 }, false);
    mountRoot.Parent = {
      Parent: undefined,
      Enabled: true,
      IsA: (className: string) => className === "LayerCollector" || className === "Instance",
    } as unknown as Instance;

    // A left-aligned vertical list whose items differ in width, next to a
    // button on the right. Right from the narrow item must reach the button.
    const list = createGuiObject("list", mountRoot, { x: 0, y: 0, w: 300, h: 200 }, false);
    const wide = createGuiObject("wide", list, { x: 0, y: 0, w: 300, h: 40 });
    const narrow = createGuiObject("narrow", list, { x: 0, y: 40, w: 80, h: 40 });
    const side = createGuiObject("side", mountRoot, { x: 600, y: 40, w: 100, h: 40 });

    const parentScopeId = focusManager.createFocusScopeId();
    focusManager.registerFocusScope(parentScopeId, {
      getRoot: () => mountRoot,
      getActive: () => true,
      getTrapped: () => false,
    });

    const listScopeId = focusManager.createFocusScopeId();
    focusManager.registerFocusScope(listScopeId, {
      parentScopeId,
      getRoot: () => list,
      getActive: () => true,
      getTrapped: () => false,
      getNavStrategy: () => "ordered",
      getNavOrientation: () => "vertical",
    });

    focusManager.registerFocusNode({ scopeId: listScopeId, getGuiObject: () => wide });
    const narrowId = focusManager.registerFocusNode({ scopeId: listScopeId, getGuiObject: () => narrow });
    focusManager.registerFocusNode({ scopeId: parentScopeId, getGuiObject: () => side });

    focusManager.focusNode(narrowId);

    const target = focusManager.resolveNavigation({ type: "move", direction: "right" });
    expect(target?.guiObject).toBe(side);

    // On-axis moves still step through the list.
    const up = focusManager.resolveNavigation({ type: "move", direction: "up" });
    expect(up?.guiObject).toBe(wide);
  });
});
