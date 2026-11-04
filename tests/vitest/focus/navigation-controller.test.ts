import { beforeEach, describe, expect, it, vi } from "vitest";

type FocusManagerModule = typeof import("../../../packages/react/focus/src/focusManager");

type ActionHandler = (actionName: string, inputState: unknown, inputObject: unknown) => unknown;

type MockGuiObject = GuiObject & {
  children: MockGuiObject[];
};

const ContextActionResult = { Sink: "Sink", Pass: "Pass" };
const UserInputState = { Begin: "Begin", Change: "Change", End: "End", Cancel: "Cancel" };

function createGuiObject(name: string, parent?: MockGuiObject, selectable = true) {
  const guiObject = {
    Name: name,
    Parent: parent,
    Visible: true,
    Selectable: selectable,
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

async function createControllerHarness() {
  vi.resetModules();

  const handlers = new Map<string, ActionHandler>();
  const navGuiService = { AutoSelectGuiEnabled: true, GuiNavigationEnabled: true };
  let heartbeat: ((deltaTime: number) => void) | undefined;
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

  vi.doMock("../../../packages/react/focus/src/focusManager/navigation/env", () => ({
    ContextActionService: {
      BindActionAtPriority(actionName: string, handler: ActionHandler) {
        handlers.set(actionName, handler);
      },
      UnbindAction(actionName: string) {
        handlers.delete(actionName);
      },
    },
    RunService: {
      Heartbeat: {
        Connect(callback: (deltaTime: number) => void) {
          heartbeat = callback;
          return {
            Disconnect() {
              heartbeat = undefined;
            },
          };
        },
      },
    },
    GuiService: navGuiService,
    UserInputService: { IsKeyDown: () => false },
  }));

  const focusManager: FocusManagerModule = await import("../../../packages/react/focus/src/focusManager");

  const mountRoot = createGuiObject("mount-root", undefined, false);
  mountRoot.Parent = {
    Parent: undefined,
    Enabled: true,
    IsA: (className: string) => className === "LayerCollector" || className === "Instance",
  } as unknown as Instance;

  const scopeRoot = createGuiObject("scope-root", mountRoot, false);
  const first = createGuiObject("first", scopeRoot);
  const second = createGuiObject("second", scopeRoot);

  const scopeId = focusManager.createFocusScopeId();
  focusManager.registerFocusScope(scopeId, {
    getRoot: () => scopeRoot,
    getActive: () => true,
    getTrapped: () => false,
    getNavStrategy: () => "ordered",
    getNavOrientation: () => "vertical",
  });
  const firstId = focusManager.registerFocusNode({ scopeId, getGuiObject: () => first });
  const secondId = focusManager.registerFocusNode({ scopeId, getGuiObject: () => second });

  focusManager.retainNavigation();

  const stick = (inputState: string, x: number, y: number) =>
    handlers.get("LatticeNavStick")?.("LatticeNavStick", inputState, { Position: { X: x, Y: y } });

  return {
    focusManager,
    firstId,
    secondId,
    stick,
    tick: (deltaTime: number) => heartbeat?.(deltaTime),
    navGuiService,
  };
}

beforeEach(() => {
  Object.assign(Enum as unknown as Record<string, unknown>, { ContextActionResult, UserInputState });
  Object.assign((Enum as unknown as { KeyCode: Record<string, string> }).KeyCode, {
    Up: "Up",
    Down: "Down",
    Left: "Left",
    Right: "Right",
    DPadUp: "DPadUp",
    DPadDown: "DPadDown",
    DPadLeft: "DPadLeft",
    DPadRight: "DPadRight",
    Tab: "Tab",
    Thumbstick1: "Thumbstick1",
    KeypadEnter: "KeypadEnter",
    ButtonA: "ButtonA",
    LeftShift: "LeftShift",
    RightShift: "RightShift",
  });
});

describe("navigation controller thumbstick", () => {
  it("passes the stick through and does not seed focus when nothing is focused", async () => {
    const harness = await createControllerHarness();

    expect(harness.focusManager.getFocusedNode()).toBeUndefined();
    expect(harness.stick(UserInputState.Begin, 0, -1)).toBe(ContextActionResult.Pass);
    expect(harness.stick(UserInputState.Change, 0, -1)).toBe(ContextActionResult.Pass);

    harness.tick(0.016);
    harness.tick(1);

    expect(harness.focusManager.getFocusedNode()).toBeUndefined();
  });

  it("sinks the stick and moves focus once focus is inside the UI", async () => {
    const harness = await createControllerHarness();
    harness.focusManager.focusNode(harness.firstId);

    expect(harness.stick(UserInputState.Change, 0, -1)).toBe(ContextActionResult.Sink);
    harness.tick(0.016);

    expect(harness.focusManager.getFocusedNode()?.id).toBe(harness.secondId);
  });

  it("stops auto-repeat when the stick input is cancelled", async () => {
    const harness = await createControllerHarness();
    harness.focusManager.focusNode(harness.firstId);

    harness.stick(UserInputState.Change, 0, -1);
    harness.tick(0.016);
    expect(harness.focusManager.getFocusedNode()?.id).toBe(harness.secondId);

    expect(harness.stick(UserInputState.Cancel, 0, -1)).toBe(ContextActionResult.Pass);
    harness.focusManager.focusNode(harness.firstId);
    harness.tick(1);
    harness.tick(1);

    expect(harness.focusManager.getFocusedNode()?.id).toBe(harness.firstId);
  });
});

describe("navigation controller ownership", () => {
  it("turns off engine GUI navigation while bound and restores it after", async () => {
    const harness = await createControllerHarness();

    // Bound by retainNavigation() in the harness.
    expect(harness.navGuiService.GuiNavigationEnabled).toBe(false);
    expect(harness.navGuiService.AutoSelectGuiEnabled).toBe(false);

    harness.focusManager.releaseNavigation();
    expect(harness.navGuiService.GuiNavigationEnabled).toBe(true);
    expect(harness.navGuiService.AutoSelectGuiEnabled).toBe(true);
  });
});
