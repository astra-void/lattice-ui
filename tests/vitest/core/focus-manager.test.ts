import { beforeEach, describe, expect, it, vi } from "vitest";

type FocusManagerModule = typeof import("../../../packages/core/src/focus/focusManager");

type MockGuiObject = GuiObject & {
  children: MockGuiObject[];
  Enabled: boolean;
};

type FocusManagerHarness = {
  focusManager: FocusManagerModule;
  mountRoot: MockGuiObject;
  getSelectedObject: () => MockGuiObject | undefined;
  setSelectedObject: (guiObject: MockGuiObject | undefined) => void;
};

function createLayerCollector() {
  return {
    Parent: undefined,
    Enabled: true,
    IsA(className: string) {
      return className === "LayerCollector" || className === "Instance";
    },
  } as unknown as LayerCollector;
}

function createGuiObject(
  name: string,
  options: {
    parent?: MockGuiObject;
    selectable?: boolean;
    visible?: boolean;
  } = {},
) {
  const guiObject = {
    Name: name,
    Parent: options.parent,
    Visible: options.visible ?? true,
    Selectable: options.selectable ?? true,
    Enabled: true,
    children: new Array<MockGuiObject>(),
    IsA(className: string) {
      return className === "GuiObject" || className === "Instance";
    },
    IsDescendantOf(ancestor: Instance) {
      let currentParent = this.Parent;
      while (currentParent !== undefined) {
        if (currentParent === ancestor) {
          return true;
        }

        currentParent = currentParent.Parent;
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

  if (options.parent) {
    options.parent.children.push(guiObject);
  }

  return guiObject;
}

async function createFocusManagerHarness(): Promise<FocusManagerHarness> {
  vi.resetModules();

  let selectedObject: MockGuiObject | undefined;
  const selectedObjectListeners = new Set<() => void>();

  vi.doMock("../../../packages/core/src/focus/env", () => ({
    GuiService: {
      get SelectedObject() {
        return selectedObject;
      },
      set SelectedObject(value: MockGuiObject | undefined) {
        selectedObject = value;
        for (const listener of selectedObjectListeners) {
          listener();
        }
      },
      GetPropertyChangedSignal(propertyName: string) {
        expect(propertyName).toBe("SelectedObject");
        return {
          Connect(callback: () => void) {
            selectedObjectListeners.add(callback);
            return {
              Disconnect() {
                selectedObjectListeners.delete(callback);
              },
            };
          },
        };
      },
    },
  }));

  const focusManager = await import("../../../packages/core/src/focus/focusManager");
  const mountRoot = createGuiObject("mount-root", {
    selectable: false,
  });
  mountRoot.Parent = createLayerCollector();

  return {
    focusManager,
    mountRoot,
    getSelectedObject: () => selectedObject,
    setSelectedObject: (guiObject) => {
      selectedObject = guiObject;
      for (const listener of selectedObjectListeners) {
        listener();
      }
    },
  };
}

beforeEach(() => {
  vi.resetModules();
});

describe("focusManager", () => {
  it("registers nodes, focuses valid targets, and clears focused state on unregister", async () => {
    const harness = await createFocusManagerHarness();
    const button = createGuiObject("button", {
      parent: harness.mountRoot,
    });

    const nodeId = harness.focusManager.registerFocusNode({
      getGuiObject: () => button,
    });

    expect(harness.focusManager.canFocusNode(nodeId)).toBe(true);
    expect(harness.focusManager.focusNode(nodeId)).toBe(button);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(nodeId);
    expect(harness.getSelectedObject()).toBe(button);

    harness.focusManager.unregisterFocusNode(nodeId);

    expect(harness.focusManager.getFocusedNode()).toBeUndefined();
    expect(harness.getSelectedObject()).toBeUndefined();
  });

  it("rejects out-of-scope targets when a trapped scope is active", async () => {
    const harness = await createFocusManagerHarness();
    const outside = createGuiObject("outside", {
      parent: harness.mountRoot,
    });
    const scopeRoot = createGuiObject("scope-root", {
      parent: harness.mountRoot,
      selectable: false,
    });
    const inside = createGuiObject("inside", { parent: scopeRoot });

    const outsideId = harness.focusManager.registerFocusNode({
      getGuiObject: () => outside,
    });
    const insideId = harness.focusManager.registerFocusNode({
      getGuiObject: () => inside,
    });

    const scopeId = harness.focusManager.createFocusScopeId();
    harness.focusManager.registerFocusScope(scopeId, {
      getRoot: () => scopeRoot,
      getActive: () => true,
      getTrapped: () => true,
    });

    expect(harness.focusManager.getFocusedNode()?.id).toBe(insideId);
    expect(harness.focusManager.focusNode(outsideId)).toBeUndefined();
    expect(harness.focusManager.getFocusedNode()?.id).toBe(insideId);
    expect(harness.getSelectedObject()).toBe(inside);
  });

  it("skips Roblox bridge sync for internally focused non-syncable nodes", async () => {
    const harness = await createFocusManagerHarness();
    const semanticNode = createGuiObject("semantic-node", {
      parent: harness.mountRoot,
      selectable: false,
    });

    const nodeId = harness.focusManager.registerFocusNode({
      getGuiObject: () => semanticNode,
      getSyncToRoblox: () => false,
    });

    expect(harness.focusManager.focusNode(nodeId)).toBe(semanticNode);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(nodeId);
    expect(harness.getSelectedObject()).toBeUndefined();
  });

  it("restores the captured target when a trapped scope deactivates", async () => {
    const harness = await createFocusManagerHarness();
    const trigger = createGuiObject("trigger", {
      parent: harness.mountRoot,
    });
    const scopeRoot = createGuiObject("scope-root", {
      parent: harness.mountRoot,
      selectable: false,
    });
    const inside = createGuiObject("inside", { parent: scopeRoot });

    const triggerId = harness.focusManager.registerFocusNode({
      getGuiObject: () => trigger,
    });
    harness.focusManager.focusNode(triggerId);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(triggerId);
    expect(harness.focusManager.captureRestoreSnapshot().nodeId).toBe(triggerId);

    let active = true;
    const scopeId = harness.focusManager.createFocusScopeId();
    harness.focusManager.registerFocusScope(scopeId, {
      getRoot: () => scopeRoot,
      getActive: () => active,
      getTrapped: () => true,
      getRestoreFocus: () => true,
    });

    harness.focusManager.registerFocusNode({
      scopeId,
      getGuiObject: () => inside,
    });

    expect(harness.getSelectedObject()).toBe(inside);

    active = false;
    harness.focusManager.syncFocusScope(scopeId);

    expect(harness.focusManager.getFocusedNode()?.id).toBe(triggerId);
    expect(harness.getSelectedObject()).toBe(trigger);
  });

  it("falls back safely when the restore target becomes invalid", async () => {
    const harness = await createFocusManagerHarness();
    const trigger = createGuiObject("trigger", {
      parent: harness.mountRoot,
    });
    const scopeRoot = createGuiObject("scope-root", {
      parent: harness.mountRoot,
      selectable: false,
    });
    const inside = createGuiObject("inside", { parent: scopeRoot });

    const triggerId = harness.focusManager.registerFocusNode({
      getGuiObject: () => trigger,
    });
    harness.focusManager.focusNode(triggerId);

    let active = true;
    const scopeId = harness.focusManager.createFocusScopeId();
    harness.focusManager.registerFocusScope(scopeId, {
      getRoot: () => scopeRoot,
      getActive: () => active,
      getTrapped: () => true,
      getRestoreFocus: () => true,
    });

    harness.focusManager.registerFocusNode({
      scopeId,
      getGuiObject: () => inside,
    });

    trigger.Parent = undefined;
    active = false;
    harness.focusManager.syncFocusScope(scopeId);

    expect(harness.focusManager.getFocusedNode()).toBeUndefined();
    expect(harness.getSelectedObject()).toBeUndefined();
  });

  it("gives nested trapped scopes priority and restores ancestor fallback on inner close", async () => {
    const harness = await createFocusManagerHarness();
    const outside = createGuiObject("outside", {
      parent: harness.mountRoot,
    });
    const outerRoot = createGuiObject("outer-root", {
      parent: harness.mountRoot,
      selectable: false,
    });
    const outerButton = createGuiObject("outer-button", { parent: outerRoot });
    const innerRoot = createGuiObject("inner-root", { parent: outerRoot, selectable: false });
    const innerButton = createGuiObject("inner-button", { parent: innerRoot });

    const outerScopeId = harness.focusManager.createFocusScopeId();
    harness.focusManager.registerFocusScope(outerScopeId, {
      getRoot: () => outerRoot,
      getActive: () => true,
      getTrapped: () => true,
    });

    let innerActive = true;
    const innerScopeId = harness.focusManager.createFocusScopeId();
    harness.focusManager.registerFocusScope(innerScopeId, {
      parentScopeId: outerScopeId,
      getRoot: () => innerRoot,
      getActive: () => innerActive,
      getTrapped: () => true,
    });

    harness.focusManager.registerFocusNode({
      scopeId: outerScopeId,
      getGuiObject: () => outerButton,
    });
    harness.focusManager.registerFocusNode({
      scopeId: innerScopeId,
      getGuiObject: () => innerButton,
    });

    harness.focusManager.retainExternalFocusBridge();
    harness.setSelectedObject(outside);
    expect(harness.getSelectedObject()).toBe(innerButton);

    innerActive = false;
    harness.focusManager.syncFocusScope(innerScopeId);
    expect(harness.getSelectedObject()).toBe(outerButton);

    harness.focusManager.releaseExternalFocusBridge();
  });

  it("bridges external selection into an implicit focus node when needed", async () => {
    const harness = await createFocusManagerHarness();
    const rawButton = createGuiObject("raw-button", {
      parent: harness.mountRoot,
    });

    harness.focusManager.retainExternalFocusBridge();
    harness.setSelectedObject(rawButton);

    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(true);
    expect(harness.focusManager.getFocusedGuiObject()).toBe(rawButton);

    harness.focusManager.releaseExternalFocusBridge();
  });

  it("prunes unreferenced implicit nodes once external bridge focus moves elsewhere", async () => {
    const harness = await createFocusManagerHarness();
    const first = createGuiObject("first-implicit", {
      parent: harness.mountRoot,
    });
    const second = createGuiObject("second-implicit", {
      parent: harness.mountRoot,
    });

    harness.focusManager.retainExternalFocusBridge();

    harness.setSelectedObject(first);
    const firstFocusId = harness.focusManager.getFocusedNode()?.id;
    expect(firstFocusId).toBeDefined();
    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(true);

    harness.setSelectedObject(second);
    const secondFocusId = harness.focusManager.getFocusedNode()?.id;
    expect(secondFocusId).toBeDefined();
    expect(secondFocusId).not.toBe(firstFocusId);

    harness.setSelectedObject(first);
    const nextFirstFocusId = harness.focusManager.getFocusedNode()?.id;
    expect(nextFirstFocusId).toBeDefined();
    expect(nextFirstFocusId).not.toBe(firstFocusId);

    harness.focusManager.releaseExternalFocusBridge();
  });

  it("keeps explicit registered nodes stable while implicit nodes are pruned", async () => {
    const harness = await createFocusManagerHarness();
    const explicitButton = createGuiObject("explicit-button", {
      parent: harness.mountRoot,
    });
    const otherButton = createGuiObject("other-button", {
      parent: harness.mountRoot,
    });

    const explicitNodeId = harness.focusManager.registerFocusNode({
      getGuiObject: () => explicitButton,
    });

    harness.focusManager.retainExternalFocusBridge();

    harness.setSelectedObject(explicitButton);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(explicitNodeId);
    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(false);

    harness.setSelectedObject(otherButton);
    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(true);

    harness.setSelectedObject(explicitButton);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(explicitNodeId);
    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(false);

    harness.focusManager.releaseExternalFocusBridge();
  });

  it("prefers actual tree order over registration order for trapped scope fallback", async () => {
    const harness = await createFocusManagerHarness();
    const scopeRoot = createGuiObject("scope-root", {
      parent: harness.mountRoot,
      selectable: false,
    });
    const first = createGuiObject("first", { parent: scopeRoot });
    const second = createGuiObject("second", { parent: scopeRoot });

    let active = false;
    const scopeId = harness.focusManager.createFocusScopeId();
    harness.focusManager.registerFocusScope(scopeId, {
      getRoot: () => scopeRoot,
      getActive: () => active,
      getTrapped: () => true,
    });

    harness.focusManager.registerFocusNode({
      scopeId,
      getGuiObject: () => second,
    });
    const firstId = harness.focusManager.registerFocusNode({
      scopeId,
      getGuiObject: () => first,
    });

    active = true;
    harness.focusManager.syncFocusScope(scopeId);

    expect(harness.focusManager.getFocusedNode()?.id).toBe(firstId);
    expect(harness.getSelectedObject()).toBe(first);
  });
  it("absorbs external Roblox selection only while the bridge listener is retained", async () => {
    const harness = await createFocusManagerHarness();
    const button = createGuiObject("button", {
      parent: harness.mountRoot,
    });
    const nodeId = harness.focusManager.registerFocusNode({
      getGuiObject: () => button,
    });

    harness.setSelectedObject(button);
    expect(harness.focusManager.getFocusedNode()).toBeUndefined();

    harness.focusManager.retainExternalFocusBridge();
    harness.setSelectedObject(button);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(nodeId);

    harness.focusManager.releaseExternalFocusBridge();
  });
});
