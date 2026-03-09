import initLayoutEngine, { compute_layout } from "@lattice-ui/layout-engine";
import layoutEngineWasmUrl from "@lattice-ui/layout-engine/layout_engine_bg.wasm?url";
import {
  buildSemanticTree,
  type ComputedRect,
  normalizeLayoutMap,
  type RegisteredNode,
  SYNTHETIC_ROOT_ID,
} from "./model";

let layoutEngineInitPromise: Promise<void> | null = null;

export function initializeLayoutEngine(): Promise<void> {
  if (!layoutEngineInitPromise) {
    layoutEngineInitPromise = initLayoutEngine({ module_or_path: layoutEngineWasmUrl }).catch((error: unknown) => {
      layoutEngineInitPromise = null;
      throw error;
    });
  }

  return layoutEngineInitPromise;
}

export function computeRegisteredLayout(
  nodes: Map<string, RegisteredNode>,
  viewportWidth: number,
  viewportHeight: number,
): Record<string, ComputedRect> {
  const tree = buildSemanticTree(nodes);
  const rawResult = compute_layout(tree, viewportWidth, viewportHeight) as unknown;
  const computedLayouts = normalizeLayoutMap(rawResult);
  delete computedLayouts[SYNTHETIC_ROOT_ID];
  return computedLayouts;
}
