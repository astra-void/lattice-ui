import initLayoutEngine, { compute_layout } from "@lattice-ui/layout-engine";
import layoutEngineWasmUrl from "@lattice-ui/layout-engine/layout_engine_bg.wasm?url";
import { type ComputedRect, normalizeLayoutMap, SYNTHETIC_ROOT_ID } from "./model";
import { computeSerializedTreeLayout, serializeLayoutTree, type LayoutTreeState } from "./tree";

let layoutEngineInitPromise: Promise<void> | undefined;

export function initializeLayoutEngine(): Promise<void> {
  if (!layoutEngineInitPromise) {
    layoutEngineInitPromise = initLayoutEngine({ module_or_path: layoutEngineWasmUrl })
      .then(() => undefined)
      .catch((error: unknown) => {
        layoutEngineInitPromise = undefined;
        throw error;
      });
  }

  return layoutEngineInitPromise;
}

export function computeRegisteredLayout(
  treeState: LayoutTreeState,
  viewportWidth: number,
  viewportHeight: number,
): Record<string, ComputedRect> {
  const tree = serializeLayoutTree(treeState);
  const rawResult = compute_layout(tree, viewportWidth, viewportHeight) as unknown;
  const computedLayouts = normalizeLayoutMap(rawResult);
  delete computedLayouts[SYNTHETIC_ROOT_ID];
  return computedLayouts;
}

export function computeFallbackLayout(
  treeState: LayoutTreeState,
  viewportWidth: number,
  viewportHeight: number,
): Record<string, ComputedRect> {
  return computeSerializedTreeLayout(serializeLayoutTree(treeState), viewportWidth, viewportHeight);
}
