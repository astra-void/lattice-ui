import { ContextActionService, GuiService, UserInputService } from "../internals/env";
import { isPointerInput, toLayerInteractEvent } from "./events";
import type { LayerInteractEvent } from "./types";

type LayerEntry = {
  id: number;
  mountOrder: number;
  getEnabled: () => boolean;
  isPointerOutside: (inputObject: InputObject) => boolean;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onEscapeKeyDown?: (event: LayerInteractEvent) => void;
  onDismiss?: () => void;
};

type RegisterLayerParams = Omit<LayerEntry, "id" | "mountOrder">;

export type LayerRegistration = {
  id: number;
  mountOrder: number;
};

const DISMISS_ACTION = "LatticeUiDismissLayerAction";
const DISMISS_ACTION_PRIORITY = 2147483647;

const layerEntries = new Array<LayerEntry>();
let nextLayerId = 0;
let nextMountOrder = 0;
let inputConnection: RBXScriptConnection | undefined;
let dismissActionBound = false;
let sinkDismissKeyUntilRelease: Enum.KeyCode | undefined;

function isDismissKey(keyCode: Enum.KeyCode) {
  return keyCode === Enum.KeyCode.Backspace || keyCode === Enum.KeyCode.ButtonB;
}

function getTopMostEnabledLayer() {
  for (let index = layerEntries.size() - 1; index >= 0; index--) {
    const entry = layerEntries[index];
    if (entry.getEnabled()) {
      return entry;
    }
  }

  return undefined;
}

function handleDismissEvent(entry: LayerEntry, event: LayerInteractEvent) {
  if (!event.defaultPrevented) {
    entry.onDismiss?.();
  }
}

function shouldIgnoreDismiss() {
  const focusedTextBox = UserInputService.GetFocusedTextBox();
  if (focusedTextBox) {
    return true;
  }

  const selectedObject = GuiService.SelectedObject;
  if (selectedObject && selectedObject.IsA("TextBox")) {
    return true;
  }

  return false;
}

function dismissTopLayerFromKey(inputObject: InputObject) {
  if (!isDismissKey(inputObject.KeyCode)) {
    return false;
  }

  const topLayer = getTopMostEnabledLayer();
  if (!topLayer) {
    return false;
  }

  if (shouldIgnoreDismiss()) {
    return false;
  }

  const dismissEvent = toLayerInteractEvent(inputObject);
  topLayer.onEscapeKeyDown?.(dismissEvent);
  handleDismissEvent(topLayer, dismissEvent);
  return true;
}

function handleInputBegan(inputObject: InputObject, gameProcessedEvent: boolean) {
  if (isDismissKey(inputObject.KeyCode)) {
    return;
  }

  if (gameProcessedEvent) {
    return;
  }

  if (!isPointerInput(inputObject)) {
    return;
  }

  const topLayer = getTopMostEnabledLayer();
  if (!topLayer) {
    return;
  }

  if (!topLayer.isPointerOutside(inputObject)) {
    return;
  }

  const outsideEvent = toLayerInteractEvent(inputObject);
  topLayer.onPointerDownOutside?.(outsideEvent);
  topLayer.onInteractOutside?.(outsideEvent);
  handleDismissEvent(topLayer, outsideEvent);
}

function bindDismissAction() {
  if (dismissActionBound) {
    return;
  }

  ContextActionService.BindActionAtPriority(
    DISMISS_ACTION,
    handleDismissAction,
    false,
    DISMISS_ACTION_PRIORITY,
    Enum.KeyCode.Backspace,
    Enum.KeyCode.ButtonB,
  );

  dismissActionBound = true;
}

function unbindDismissAction() {
  if (!dismissActionBound) {
    return;
  }

  ContextActionService.UnbindAction(DISMISS_ACTION);
  dismissActionBound = false;
}

function handleDismissAction(
  _actionName: string,
  inputState: Enum.UserInputState,
  inputObject: InputObject,
) {
  if (inputState === Enum.UserInputState.Begin) {
    if (dismissTopLayerFromKey(inputObject)) {
      sinkDismissKeyUntilRelease = inputObject.KeyCode;
      return Enum.ContextActionResult.Sink;
    }

    return Enum.ContextActionResult.Pass;
  }

  if (sinkDismissKeyUntilRelease === inputObject.KeyCode) {
    if (inputState === Enum.UserInputState.End || inputState === Enum.UserInputState.Cancel) {
      sinkDismissKeyUntilRelease = undefined;
      if (layerEntries.size() === 0) {
        unbindDismissAction();
      }
    }

    return Enum.ContextActionResult.Sink;
  }

  return Enum.ContextActionResult.Pass;
}

function startInputListener() {
  bindDismissAction();

  if (inputConnection) {
    return;
  }

  inputConnection = UserInputService.InputBegan.Connect((inputObject, gameProcessedEvent) => {
    handleInputBegan(inputObject, gameProcessedEvent);
  });
}

function stopInputListener() {
  if (inputConnection) {
    inputConnection.Disconnect();
    inputConnection = undefined;
  }

  if (!sinkDismissKeyUntilRelease) {
    unbindDismissAction();
  }
}

function syncInputListener() {
  if (layerEntries.size() > 0) {
    startInputListener();
  } else {
    stopInputListener();
  }
}

export function registerLayer(params: RegisterLayerParams): LayerRegistration {
  nextLayerId += 1;
  nextMountOrder += 1;

  const entry: LayerEntry = {
    id: nextLayerId,
    mountOrder: nextMountOrder,
    ...params,
  };

  layerEntries.push(entry);
  syncInputListener();

  return {
    id: entry.id,
    mountOrder: entry.mountOrder,
  };
}

export function unregisterLayer(layerId: number) {
  const layerIndex = layerEntries.findIndex((entry) => entry.id === layerId);
  if (layerIndex === -1) {
    return;
  }

  layerEntries.remove(layerIndex);
  syncInputListener();
}
