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

const layerEntries: LayerEntry[] = [];
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

function handleInputBegan(inputObject: InputObject) {
  // Do NOT filter on gameProcessedEvent: Roblox marks any press sunk by an
  // Active GUI element as processed, which includes the layer's own modal
  // blocker and every other button on screen — exactly the presses that must
  // dismiss. Inside/outside is decided by geometry (isPointerOutside), and
  // triggers opt out via insideRefs.
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

  inputConnection = UserInputService.InputBegan.Connect((inputObject) => {
    handleInputBegan(inputObject);
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

/**
 * Moves a layer to the top of the stack, assigning it a fresh mount order.
 * Called when a layer becomes enabled (opens) so z-order and dismissal order
 * follow open order rather than component mount order. Returns the layer's
 * (possibly new) mount order, or undefined if the layer is not registered.
 */
export function promoteLayer(layerId: number): number | undefined {
  const layerIndex = layerEntries.findIndex((entry) => entry.id === layerId);
  if (layerIndex === -1) {
    return undefined;
  }

  const entry = layerEntries[layerIndex];
  if (layerIndex === layerEntries.size() - 1) {
    return entry.mountOrder;
  }

  layerEntries.remove(layerIndex);
  nextMountOrder += 1;
  entry.mountOrder = nextMountOrder;
  layerEntries.push(entry);
  return entry.mountOrder;
}

export function unregisterLayer(layerId: number) {
  const layerIndex = layerEntries.findIndex((entry) => entry.id === layerId);
  if (layerIndex === -1) {
    return;
  }

  layerEntries.remove(layerIndex);
  syncInputListener();
}
