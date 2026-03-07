import initLayoutEngine, { compute_layout } from "layout-engine";
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
        id: "CenterButton",
        node_type: "TextButton",
        size: {
          x: { scale: 0, offset: 200 },
          y: { scale: 0, offset: 50 },
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

export function WasmTestApp() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [layout, setLayout] = React.useState<Record<string, ComputedRect>>({});

  React.useEffect(() => {
    let cancelled = false;
    let detachResize: (() => void) | undefined;

    const boot = async () => {
      try {
        await initLayoutEngine();

        if (cancelled) {
          return;
        }

        const recalculate = () => {
          const computed = compute_layout(createMockTree(), window.innerWidth, window.innerHeight) as Record<
            string,
            ComputedRect
          >;
          setLayout(computed);
        };

        recalculate();
        window.addEventListener("resize", recalculate);
        detachResize = () => window.removeEventListener("resize", recalculate);
        setLoading(false);
      } catch (nextError) {
        if (!cancelled) {
          setError(toErrorMessage(nextError));
          setLoading(false);
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
      detachResize?.();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: "grid", height: "100vh", placeItems: "center" }}>
        <h2>Loading Engine...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "grid", gap: 8, height: "100vh", placeContent: "center", textAlign: "center" }}>
        <h2>Engine Load Failed</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #eef2f9 0%, #dce4f5 100%)",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        width: "100vw",
      }}
    >
      {Object.entries(layout).map(([id, rect]) => (
        <div
          key={id}
          style={{
            background: id === "CenterButton" ? "rgba(31, 103, 214, 0.2)" : "rgba(255, 255, 255, 0.25)",
            border: id === "CenterButton" ? "2px solid #1f67d6" : "1px dashed #4a5a78",
            color: "#1b2538",
            fontSize: 14,
            fontWeight: 700,
            height: `${rect.height}px`,
            left: `${rect.x}px`,
            position: "absolute",
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            zIndex: id === "CenterButton" ? 2 : 1,
          }}
        >
          <div style={{ padding: 8 }}>
            {id} ({Math.round(rect.x)}, {Math.round(rect.y)})
          </div>
        </div>
      ))}
    </div>
  );
}
