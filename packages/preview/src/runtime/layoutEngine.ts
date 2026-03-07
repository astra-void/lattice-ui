import initLayoutEngine, { compute_layout } from "@lattice-ui/layout-engine";

export type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SolverUDim = {
  scale: number;
  offset: number;
};

type SolverUDim2 = {
  x: SolverUDim;
  y: SolverUDim;
};

type SolverVector2 = {
  x: number;
  y: number;
};

type SolverNode = {
  id: string;
  node_type: string;
  size: SolverUDim2;
  position: SolverUDim2;
  anchor_point: SolverVector2;
  children: SolverNode[];
};

type ComputedRectLike = {
  x: number;
  y: number;
  width: number;
  height: number;
};

let layoutEngineInitPromise: Promise<void> | null = null;

function isComputedRectLike(value: unknown): value is ComputedRectLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.x === "number" &&
    typeof record.y === "number" &&
    typeof record.width === "number" &&
    typeof record.height === "number"
  );
}

function normalizeLayoutMap(raw: unknown): Record<string, ComputedRectLike> {
  if (!(raw instanceof Map) && !(typeof raw === "object" && raw !== null)) {
    throw new Error(`Unexpected compute_layout result type: ${typeof raw}`);
  }

  const entries =
    raw instanceof Map
      ? (Array.from(raw.entries()) as Array<[string, unknown]>)
      : Object.entries(raw as Record<string, unknown>);

  const normalized: Record<string, ComputedRectLike> = {};
  for (const [key, value] of entries) {
    if (!isComputedRectLike(value)) {
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

async function ensureLayoutEngineReady() {
  if (!layoutEngineInitPromise) {
    layoutEngineInitPromise = initLayoutEngine().then(() => undefined);
  }

  await layoutEngineInitPromise;
}

export type ComputeNodeRectInput = {
  nodeType: string;
  size: SolverUDim2;
  position: SolverUDim2;
  anchorPoint: SolverVector2;
  parentRect: LayoutRect;
};

export async function computeNodeRectWithWasm(input: ComputeNodeRectInput): Promise<LayoutRect> {
  await ensureLayoutEngineReady();

  const childId = "__node__";
  const tree: SolverNode = {
    id: "__root__",
    node_type: "Frame",
    size: {
      x: { scale: 1, offset: 0 },
      y: { scale: 1, offset: 0 },
    },
    position: {
      x: { scale: 0, offset: 0 },
      y: { scale: 0, offset: 0 },
    },
    anchor_point: { x: 0, y: 0 },
    children: [
      {
        id: childId,
        node_type: input.nodeType,
        size: input.size,
        position: input.position,
        anchor_point: input.anchorPoint,
        children: [],
      },
    ],
  };

  const raw = compute_layout(tree, input.parentRect.width, input.parentRect.height) as unknown;
  const result = normalizeLayoutMap(raw);
  const computed = result[childId];

  if (!computed) {
    throw new Error("compute_layout result did not include the requested node.");
  }

  return {
    x: input.parentRect.x + computed.x,
    y: input.parentRect.y + computed.y,
    width: computed.width,
    height: computed.height,
  };
}
