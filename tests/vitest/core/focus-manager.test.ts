import { beforeEach, describe, expect, it, vi } from "vitest";

type FocusManagerModule = typeof import("../../../packages/react/focus/src/focusManager");

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

  vi.doMock("../../../packages/react/focus/src/env", () => ({
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

  const focusManager = await import("../../../packages/react/focus/src/focusManager");
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

    // Registering nodes under a trapped scope enforces focus into the top-most
    // trapped scope's fallback without any external selection round-trip.
    expect(harness.getSelectedObject()).toBe(innerButton);

    innerActive = false;
    harness.focusManager.syncFocusScope(innerScopeId);
    expect(harness.getSelectedObject()).toBe(outerButton);
  });

  it("creates an implicit focus node when focusing a raw GuiObject", async () => {
    const harness = await createFocusManagerHarness();
    const rawButton = createGuiObject("raw-button", {
      parent: harness.mountRoot,
    });

    harness.focusManager.focusGuiObject(rawButton);

    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(true);
    expect(harness.focusManager.getFocusedGuiObject()).toBe(rawButton);
    // Focus is mirrored to Roblox selection for rendering (render-only bridge).
    expect(harness.getSelectedObject()).toBe(rawButton);
  });

  it("resolves explicit nodes over implicit ones and keeps explicit ids stable", async () => {
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

    harness.focusManager.focusGuiObject(explicitButton);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(explicitNodeId);
    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(false);

    harness.focusManager.focusGuiObject(otherButton);
    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(true);

    harness.focusManager.focusGuiObject(explicitButton);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(explicitNodeId);
    expect(harness.focusManager.getFocusedNode()?.implicit).toBe(false);
  });

  it("steps through an ordered scope by registration order", async () => {
    const harness = await createFocusManagerHarness();
    const scopeRoot = createGuiObject("ordered-root", {
      parent: harness.mountRoot,
      selectable: false,
    });
    const first = createGuiObject("first", { parent: scopeRoot });
    const second = createGuiObject("second", { parent: scopeRoot });
    const third = createGuiObject("third", { parent: scopeRoot });

    const scopeId = harness.focusManager.createFocusScopeId();
    harness.focusManager.registerFocusScope(scopeId, {
      getRoot: () => scopeRoot,
      getActive: () => true,
      getTrapped: () => false,
      getNavStrategy: () => "ordered",
      getNavOrientation: () => "vertical",
      getNavWrap: () => true,
    });

    const firstId = harness.focusManager.registerFocusNode({ scopeId, getGuiObject: () => first });
    harness.focusManager.registerFocusNode({ scopeId, getGuiObject: () => second });
    harness.focusManager.registerFocusNode({ scopeId, getGuiObject: () => third });

    harness.focusManager.focusNode(firstId);
    expect(harness.focusManager.getFocusedGuiObject()).toBe(first);

    // On-axis moves step through the ordered list.
    expect(harness.focusManager.resolveNavigation({ type: "move", direction: "down" })?.guiObject).toBe(second);

    harness.focusManager.focusGuiObject(third);
    // Wrapping enabled: stepping past the end returns to the first node.
    expect(harness.focusManager.resolveNavigation({ type: "move", direction: "down" })?.guiObject).toBe(first);

    // Stepping backward from the first node wraps to the last.
    harness.focusManager.focusGuiObject(first);
    expect(harness.focusManager.resolveNavigation({ type: "move", direction: "up" })?.guiObject).toBe(third);
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
  it("ignores external Roblox selection changes (selection bridge is render-only)", async () => {
    const harness = await createFocusManagerHarness();
    const button = createGuiObject("button", {
      parent: harness.mountRoot,
    });
    harness.focusManager.registerFocusNode({
      getGuiObject: () => button,
    });

    // Navigation is owned by the controller; a raw external selection change is
    // not absorbed back into focus state.
    harness.setSelectedObject(button);
    expect(harness.focusManager.getFocusedNode()).toBeUndefined();
  });

  it("notifies nodes as focus enters and leaves them", async () => {
    const harness = await createFocusManagerHarness();
    const first = createGuiObject("first", { parent: harness.mountRoot });
    const second = createGuiObject("second", { parent: harness.mountRoot });

    const onFirstFocusChange = vi.fn();
    const onSecondFocusChange = vi.fn();

    const firstId = harness.focusManager.registerFocusNode({
      getGuiObject: () => first,
      onFocusChange: onFirstFocusChange,
    });
    const secondId = harness.focusManager.registerFocusNode({
      getGuiObject: () => second,
      onFocusChange: onSecondFocusChange,
    });

    harness.focusManager.focusNode(firstId);
    expect(onFirstFocusChange.mock.calls).toEqual([[true]]);

    // Re-focusing the same node is not a change and must not re-notify.
    harness.focusManager.focusNode(firstId);
    expect(onFirstFocusChange.mock.calls).toEqual([[true]]);

    harness.focusManager.focusNode(secondId);
    expect(onFirstFocusChange.mock.calls).toEqual([[true], [false]]);
    expect(onSecondFocusChange.mock.calls).toEqual([[true]]);

    // A node that unregisters while focused still hears that it lost focus.
    harness.focusManager.unregisterFocusNode(secondId);
    expect(onSecondFocusChange.mock.calls).toEqual([[true], [false]]);
  });

  it("routes activation to the focused node and reports when it went unhandled", async () => {
    const harness = await createFocusManagerHarness();
    const handled = createGuiObject("handled", { parent: harness.mountRoot });
    const unhandled = createGuiObject("unhandled", { parent: harness.mountRoot });

    const activate = vi.fn(() => true);
    const handledId = harness.focusManager.registerFocusNode({
      getGuiObject: () => handled,
      activate,
    });
    const unhandledId = harness.focusManager.registerFocusNode({
      getGuiObject: () => unhandled,
    });

    // Nothing focused: there is no activation to run.
    expect(harness.focusManager.activateFocusedNode()).toBe(false);

    harness.focusManager.focusNode(handledId);
    expect(harness.focusManager.activateFocusedNode()).toBe(true);
    expect(activate).toHaveBeenCalledTimes(1);

    // A node without its own activation leaves the input for the engine.
    harness.focusManager.focusNode(unhandledId);
    expect(harness.focusManager.activateFocusedNode()).toBe(false);
    expect(activate).toHaveBeenCalledTimes(1);
  });
});
