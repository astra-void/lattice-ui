import { UserInputService } from "../internals/env";
import { isPointerInput, toLayerInteractEvent } from "./events";
import type { LayerInteractEvent } from "./types";

type LayerEntry = {
  id: number;
  mountOrder: number;
  getEnabled: () => boolean;
  isPointerOutside: (inputObject: InputObject) => boolean;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onDismiss?: () => void;
};

type RegisterLayerParams = Omit<LayerEntry, "id" | "mountOrder">;

export type LayerRegistration = {
  id: number;
  mountOrder: number;
};

const layerEntries = new Array<LayerEntry>();
let nextLayerId = 0;
let nextMountOrder = 0;
let inputConnection: RBXScriptConnection | undefined;

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

function handleInputBegan(inputObject: InputObject, gameProcessedEvent: boolean) {
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

function startInputListener() {
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
