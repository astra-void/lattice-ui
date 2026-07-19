import { focusNode, getFocusedNode } from "../engine";
import { focusState } from "../state";
import type { NavDirection } from "../types";
import { ContextActionService, GuiService, RunService, UserInputService } from "./env";
import { currentNodeCapturesDirectional, resolveNavigation } from "./resolve";

// Bound above the engine's default gamepad selection so our directional
// handling preempts native GUI navigation.
const BIND_PRIORITY = 3000;

// Thumbstick auto-repeat timing (seconds) and activation threshold.
const STICK_DEADZONE = 0.4;
const STICK_INITIAL_DELAY = 0.4;
const STICK_REPEAT_INTERVAL = 0.12;

const ACTION_UP = "LatticeNavUp";
const ACTION_DOWN = "LatticeNavDown";
const ACTION_LEFT = "LatticeNavLeft";
const ACTION_RIGHT = "LatticeNavRight";
const ACTION_TAB = "LatticeNavTab";
const ACTION_STICK = "LatticeNavStick";

let bound = false;
let heartbeatConnection: RBXScriptConnection | undefined;
let previousAutoSelectGuiEnabled = true;

let stickVector = new Vector2(0, 0);
let heldStickDirection: NavDirection | undefined;
let stickRepeatTimer = 0;

type MoveResult = "moved" | "captured" | "none";

// Applies a directional move to focus. Returns whether focus moved, whether the
// focused widget captured the direction itself, or that there was nothing to do.
function moveFocus(direction: NavDirection): MoveResult {
  if (currentNodeCapturesDirectional(direction)) {
    return "captured";
  }

  const target = resolveNavigation({ type: "move", direction });
  if (target) {
    focusNode(target.record.id);
    return "moved";
  }

  return "none";
}

function handleDirection(direction: NavDirection): Enum.ContextActionResult {
  const result = moveFocus(direction);
  if (result === "captured") {
    return Enum.ContextActionResult.Pass;
  }
  if (result === "moved") {
    return Enum.ContextActionResult.Sink;
  }

  // Focus is inside our UI but there is nowhere to move (trap edge): swallow the
  // input so native selection cannot drift. When nothing is focused, let the
  // game receive the input.
  return getFocusedNode() !== undefined ? Enum.ContextActionResult.Sink : Enum.ContextActionResult.Pass;
}

function makeDirectionHandler(direction: NavDirection) {
  return (_actionName: string, inputState: Enum.UserInputState): Enum.ContextActionResult => {
    if (inputState !== Enum.UserInputState.Begin) {
      return Enum.ContextActionResult.Pass;
    }
    return handleDirection(direction);
  };
}

function handleTab(_actionName: string, inputState: Enum.UserInputState): Enum.ContextActionResult {
  if (inputState !== Enum.UserInputState.Begin) {
    return Enum.ContextActionResult.Pass;
  }

  const shift =
    UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) || UserInputService.IsKeyDown(Enum.KeyCode.RightShift);
  const target = resolveNavigation({ type: shift ? "prev" : "next" });
  if (target) {
    focusNode(target.record.id);
    return Enum.ContextActionResult.Sink;
  }

  return Enum.ContextActionResult.Pass;
}

function handleStick(
  _actionName: string,
  inputState: Enum.UserInputState,
  inputObject: InputObject,
): Enum.ContextActionResult {
  if (inputState === Enum.UserInputState.End) {
    stickVector = new Vector2(0, 0);
    return Enum.ContextActionResult.Sink;
  }

  stickVector = new Vector2(inputObject.Position.X, inputObject.Position.Y);
  return Enum.ContextActionResult.Sink;
}

function stickToDirection(vector: Vector2): NavDirection | undefined {
  if (vector.Magnitude < STICK_DEADZONE) {
    return undefined;
  }

  if (math.abs(vector.X) > math.abs(vector.Y)) {
    return vector.X > 0 ? "right" : "left";
  }

  // Thumbstick Y is positive when pushed up; screen "up" is toward the top.
  return vector.Y > 0 ? "up" : "down";
}

function handleHeartbeat(deltaTime: number) {
  const direction = stickToDirection(stickVector);
  if (direction === undefined) {
    heldStickDirection = undefined;
    return;
  }

  if (direction !== heldStickDirection) {
    heldStickDirection = direction;
    stickRepeatTimer = STICK_INITIAL_DELAY;
    moveFocus(direction);
    return;
  }

  stickRepeatTimer -= deltaTime;
  if (stickRepeatTimer <= 0) {
    stickRepeatTimer = STICK_REPEAT_INTERVAL;
    moveFocus(direction);
  }
}

function bindNavigation() {
  if (bound) {
    return;
  }
  bound = true;

  previousAutoSelectGuiEnabled = GuiService.AutoSelectGuiEnabled;
  GuiService.AutoSelectGuiEnabled = false;

  ContextActionService.BindActionAtPriority(
    ACTION_UP,
    makeDirectionHandler("up"),
    false,
    BIND_PRIORITY,
    Enum.KeyCode.Up,
    Enum.KeyCode.DPadUp,
  );
  ContextActionService.BindActionAtPriority(
    ACTION_DOWN,
    makeDirectionHandler("down"),
    false,
    BIND_PRIORITY,
    Enum.KeyCode.Down,
    Enum.KeyCode.DPadDown,
  );
  ContextActionService.BindActionAtPriority(
    ACTION_LEFT,
    makeDirectionHandler("left"),
    false,
    BIND_PRIORITY,
    Enum.KeyCode.Left,
    Enum.KeyCode.DPadLeft,
  );
  ContextActionService.BindActionAtPriority(
    ACTION_RIGHT,
    makeDirectionHandler("right"),
    false,
    BIND_PRIORITY,
    Enum.KeyCode.Right,
    Enum.KeyCode.DPadRight,
  );
  ContextActionService.BindActionAtPriority(ACTION_TAB, handleTab, false, BIND_PRIORITY, Enum.KeyCode.Tab);
  ContextActionService.BindActionAtPriority(ACTION_STICK, handleStick, false, BIND_PRIORITY, Enum.KeyCode.Thumbstick1);

  heartbeatConnection = RunService.Heartbeat.Connect((deltaTime) => {
    handleHeartbeat(deltaTime);
  });
}

function unbindNavigation() {
  if (!bound) {
    return;
  }
  bound = false;

  ContextActionService.UnbindAction(ACTION_UP);
  ContextActionService.UnbindAction(ACTION_DOWN);
  ContextActionService.UnbindAction(ACTION_LEFT);
  ContextActionService.UnbindAction(ACTION_RIGHT);
  ContextActionService.UnbindAction(ACTION_TAB);
  ContextActionService.UnbindAction(ACTION_STICK);

  heartbeatConnection?.Disconnect();
  heartbeatConnection = undefined;

  stickVector = new Vector2(0, 0);
  heldStickDirection = undefined;

  GuiService.AutoSelectGuiEnabled = previousAutoSelectGuiEnabled;
}

// Binds navigation input while at least one FocusScope is active. Uses the same
// reference-counting lifecycle the external selection bridge used before.
export function retainNavigation() {
  focusState.navigationConsumerCount += 1;
  if (focusState.navigationConsumerCount === 1) {
    bindNavigation();
  }
}

export function releaseNavigation() {
  focusState.navigationConsumerCount = math.max(0, focusState.navigationConsumerCount - 1);
  if (focusState.navigationConsumerCount === 0) {
    unbindNavigation();
  }
}
