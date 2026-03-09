import initLayoutEngine, { compute_layout } from "@lattice-ui/layout-engine";
import layoutEngineWasmUrl from "@lattice-ui/layout-engine/layout_engine_bg.wasm?url";
import React from "react";

type UDim = {
  scale: number;
  offset: number;
};

type UDim2 = {
  x: UDim;
  y: UDim;
};

type Vector2 = {
  x: number;
  y: number;
};

type RobloxNode = {
  id: string;
  node_type: string;
  size: UDim2;
  position: UDim2;
  anchor_point: Vector2;
  children: RobloxNode[];
};

type ComputedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;

function createMockTree(): RobloxNode {
  return {
    id: "Root",
    node_type: "ScreenGui",
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
        id: "CenterBox",
        node_type: "Frame",
        size: {
          x: { scale: 0, offset: 300 },
          y: { scale: 0, offset: 100 },
        },
        position: {
          x: { scale: 0.5, offset: 0 },
          y: { scale: 0.5, offset: 0 },
        },
        anchor_point: { x: 0.5, y: 0.5 },
        children: [],
      },
    ],
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isValidWasmMagic(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d;
}

function formatHeader(bytes: Uint8Array): string {
  return Array.from(bytes.slice(0, 4))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join(" ");
}

function isComputedRect(value: unknown): value is ComputedRect {
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

function normalizeLayoutResult(raw: unknown): Record<string, ComputedRect> {
  if (!(raw instanceof Map) && !(typeof raw === "object" && raw !== null)) {
    throw new Error(`Unexpected layout result type: ${typeof raw}`);
  }

  const entries =
    raw instanceof Map
      ? (Array.from(raw.entries()) as Array<[string, unknown]>)
      : Object.entries(raw as Record<string, unknown>);

  const normalized: Record<string, ComputedRect> = {};
  for (const [key, value] of entries) {
    if (!isComputedRect(value)) {
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

export function WasmTestApp() {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [layoutResult, setLayoutResult] = React.useState<Record<string, ComputedRect>>({});
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      setError(`Unhandled rejection: ${toErrorMessage(event.reason)}`);
      setIsLoaded(false);
    };

    const initialize = async () => {
      try {
        const response = await fetch(layoutEngineWasmUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch Wasm binary (${response.status}) from ${layoutEngineWasmUrl}`);
        }

        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!isValidWasmMagic(bytes)) {
          throw new Error(
            `Invalid Wasm binary header from ${layoutEngineWasmUrl}. Expected 00 61 73 6d, received ${formatHeader(bytes)}`,
          );
        }

        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "application/wasm" }));
        await initLayoutEngine({ module_or_path: blobUrl });

        if (cancelled) {
          return;
        }

        const rawComputed = compute_layout(createMockTree(), VIEWPORT_WIDTH, VIEWPORT_HEIGHT) as unknown;
        const computed = normalizeLayoutResult(rawComputed);

        if (!computed.CenterBox) {
          throw new Error("Layout result does not include `CenterBox`. Check serialization shape from Wasm bridge.");
        }

        if (cancelled) {
          return;
        }

        setLayoutResult(computed);
        setError("");
        setIsLoaded(true);
      } catch (nextError) {
        if (!cancelled) {
          setError(`Wasm engine failed: ${toErrorMessage(nextError)}`);
          setIsLoaded(false);
        }
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    void initialize();

    return () => {
      cancelled = true;
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  if (!isLoaded && !error) {
    return (
      <div style={{ display: "grid", height: "100vh", placeItems: "center" }}>
        <h2>Loading Wasm Engine...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          alignItems: "center",
          background: "#ffebee",
          color: "#b71c1c",
          display: "grid",
          gap: 12,
          height: "100vh",
          justifyItems: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h2>Wasm Initialization Error</h2>
        <pre style={{ margin: 0, maxWidth: 900, whiteSpace: "pre-wrap" }}>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ alignItems: "center", display: "grid", height: "100vh", justifyItems: "center" }}>
      <div
        style={{
          background: "#bdbdbd",
          border: "1px solid #888",
          height: VIEWPORT_HEIGHT,
          overflow: "hidden",
          position: "relative",
          width: VIEWPORT_WIDTH,
        }}
      >
        {Object.entries(layoutResult)
          .filter(([id]) => id !== "Root")
          .map(([id, rect]) => (
            <div
              key={id}
              style={{
                background: "#1976d2",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                height: `${rect.height}px`,
                left: `${rect.x}px`,
                lineHeight: `${rect.height}px`,
                position: "absolute",
                textAlign: "center",
                top: `${rect.y}px`,
                width: `${rect.width}px`,
              }}
            >
              {id} ({Math.round(rect.x)}, {Math.round(rect.y)})
            </div>
          ))}
      </div>
    </div>
  );
}
