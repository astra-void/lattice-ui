// @vitest-environment jsdom

import {
  Frame,
  LayoutProvider,
  ScreenGui,
  Slot,
  TextLabel,
  UDim2,
  UIListLayout,
  UIPadding,
} from "@lattice-ui/preview/runtime";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const layoutEngineMocks = vi.hoisted(() => ({
  computeLayout: vi.fn(() => ({})),
  init: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock("@lattice-ui/layout-engine", () => ({
  compute_layout: layoutEngineMocks.computeLayout,
  default: layoutEngineMocks.init,
}));

type MockTreeNode = {
  id: string;
  children?: MockTreeNode[];
};

function createMockLayoutResult(tree: MockTreeNode) {
  const result: Record<string, { height: number; width: number; x: number; y: number }> = {};

  const visit = (node: MockTreeNode, depth: number) => {
    result[node.id] = {
      height: Math.max(40, 220 - depth * 20),
      width: Math.max(80, 420 - depth * 40),
      x: depth * 11,
      y: depth * 17,
    };

    for (const child of node.children ?? []) {
      visit(child, depth + 1);
    }
  };

  visit(tree, 0);
  return result;
}
function DelayedNestedTree() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <ScreenGui Id="delayed-screen">
      <Frame Id="delayed-frame">
        <TextLabel Id="delayed-label" Text="Delayed label" />
      </Frame>
    </ScreenGui>
  );
}

beforeEach(() => {
  layoutEngineMocks.computeLayout.mockReset();
  layoutEngineMocks.computeLayout.mockImplementation(() => ({}));
  layoutEngineMocks.init.mockReset();
  layoutEngineMocks.init.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe("preview runtime host mapping", () => {
  it("uses bare preview ids and shows a debug fallback when Wasm output is missing", () => {
    render(
      <Frame Position={UDim2.fromOffset(12, 18)} Size={UDim2.fromOffset(120, 48)}>
        Debug frame
      </Frame>,
    );

    const frame = document.querySelector('[data-preview-host="frame"]') as HTMLElement;
    expect(frame.dataset.previewNodeId).toMatch(/^preview-node-\d+$/);
    expect(frame.dataset.previewNodeId).not.toContain("frame:");
    expect(frame.style.visibility).toBe("visible");
    expect(frame.style.left).toBe("12px");
    expect(frame.style.top).toBe("18px");
    expect(frame.style.width).toBe("120px");
    expect(frame.style.height).toBe("48px");
    expect(frame.style.outline).toContain("red");
  });

  it("merges slot and child activated handlers", async () => {
    const user = userEvent.setup();
    const childActivated = vi.fn();
    const slotActivated = vi.fn();

    render(
      <Slot Event={{ Activated: () => slotActivated() }}>
        <button onClick={() => childActivated()} type="button">
          Trigger
        </button>
      </Slot>,
    );

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    expect(childActivated).toHaveBeenCalledTimes(1);
    expect(slotActivated).toHaveBeenCalledTimes(1);
  });

  it("renders expanded host support without leaking preview-only props to the DOM", () => {
    render(
      <Frame>
        <UIListLayout FillDirection="vertical" SortOrder="layout-order" />
        <UIPadding PaddingLeft="10px" />
        <TextLabel Text="Hello preview" TextXAlignment="left" />
      </Frame>,
    );

    expect(screen.getByText("Hello preview")).toBeTruthy();
    expect(document.querySelector('[data-preview-host="uilistlayout"]')).toBeTruthy();
    expect(document.querySelector("[filldirection]")).toBeNull();
  });

  it("renders a viewport-filling layout provider container", () => {
    render(
      <LayoutProvider>
        <div data-testid="layout-child" />
      </LayoutProvider>,
    );

    const container = screen.getByTestId("layout-child").parentElement as HTMLElement;
    expect(container.dataset.previewLayoutProvider).toBe("");
    expect(container.style.display).toBe("block");
    expect(container.style.width).toBe("100%");
    expect(container.style.height).toBe("100%");
    expect(container.style.minHeight).toBe("500px");
  });

  it("uses the resolved viewport for ScreenGui fallback rects while Wasm layout is pending", () => {
    render(
      <LayoutProvider viewportHeight={480} viewportWidth={640}>
        <ScreenGui />
      </LayoutProvider>,
    );

    const screenGui = document.querySelector('[data-preview-host="screengui"]') as HTMLElement;
    expect(screenGui.style.left).toBe("0px");
    expect(screenGui.style.top).toBe("0px");
    expect(screenGui.style.width).toBe("640px");
    expect(screenGui.style.height).toBe("480px");
    expect(screenGui.style.outline).toContain("red");
  });
  it("serializes frame defaults and textlabel layout props before calling Wasm", async () => {
    layoutEngineMocks.computeLayout.mockImplementation((tree, viewportWidth, viewportHeight) => {
      expect(viewportWidth).toBe(800);
      expect(viewportHeight).toBe(600);
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        id: "preview-node-screen",
        node_type: "ScreenGui",
      });
      expect(tree.children[0]?.children[0]).toMatchObject({
        id: "preview-node-frame",
        node_type: "Frame",
        position: {
          x: { offset: 0, scale: 0 },
          y: { offset: 0, scale: 0 },
        },
        size: {
          x: { offset: 0, scale: 1 },
          y: { offset: 0, scale: 1 },
        },
      });
      expect(tree.children[0]?.children[0]?.children[0]).toMatchObject({
        id: "preview-node-label",
        node_type: "TextLabel",
        anchor_point: { x: 0.5, y: 0.5 },
        position: {
          x: { offset: 0, scale: 0.5 },
          y: { offset: 0, scale: 0.5 },
        },
        size: {
          x: { offset: 420, scale: 0 },
          y: { offset: 40, scale: 0 },
        },
      });

      return {
        __lattice_preview_root__: { height: 600, width: 800, x: 0, y: 0 },
        "preview-node-screen": { height: 600, width: 800, x: 0, y: 0 },
        "preview-node-frame": { height: 600, width: 800, x: 0, y: 0 },
        "preview-node-label": { height: 40, width: 420, x: 190, y: 280 },
      };
    });

    render(
      <LayoutProvider debounceMs={0} viewportHeight={600} viewportWidth={800}>
        <ScreenGui Id="preview-node-screen">
          <Frame Id="preview-node-frame">
            <TextLabel
              AnchorPoint={[0.5, 0.5]}
              Id="preview-node-label"
              Position={[0.5, 0, 0.5, 0]}
              Size={[0, 420, 0, 40]}
              Text="Centered"
            />
          </Frame>
        </ScreenGui>
      </LayoutProvider>,
    );

    const frame = document.querySelector('[data-preview-node-id="preview-node-frame"]') as HTMLElement;
    const label = document.querySelector('[data-preview-node-id="preview-node-label"]') as HTMLElement;

    await waitFor(() => {
      expect(frame.style.width).toBe("800px");
      expect(frame.style.height).toBe("600px");
      expect(label.style.left).toBe("190px");
      expect(label.style.top).toBe("280px");
      expect(label.style.width).toBe("420px");
      expect(label.style.height).toBe("40px");
    });
  });

  it("forces top-level ScreenGui nodes to fill the viewport in the Wasm tree", async () => {
    render(
      <LayoutProvider debounceMs={0} viewportHeight={480} viewportWidth={640}>
        <ScreenGui AnchorPoint={{ X: 1, Y: 1 }} Position={UDim2.fromOffset(20, 30)} Size={UDim2.fromOffset(40, 50)}>
          <Frame Position={UDim2.fromOffset(10, 20)} Size={UDim2.fromOffset(80, 32)} />
        </ScreenGui>
      </LayoutProvider>,
    );

    await waitFor(() => {
      expect(layoutEngineMocks.computeLayout).toHaveBeenCalled();
      const calls = layoutEngineMocks.computeLayout.mock.calls;
      const lastCall = calls[calls.length - 1] as [
        {
          children: Array<{
            anchor_point: { x: number; y: number };
            children: unknown[];
            node_type: string;
            position: { x: { offset: number; scale: number }; y: { offset: number; scale: number } };
            size: { x: { offset: number; scale: number }; y: { offset: number; scale: number } };
          }>;
        },
        number,
        number,
      ];
      const [tree, viewportWidth, viewportHeight] = lastCall;

      expect(viewportWidth).toBe(640);
      expect(viewportHeight).toBe(480);
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]).toMatchObject({
        anchor_point: { x: 0, y: 0 },
        node_type: "ScreenGui",
        position: {
          x: { offset: 0, scale: 0 },
          y: { offset: 0, scale: 0 },
        },
        size: {
          x: { offset: 0, scale: 1 },
          y: { offset: 0, scale: 1 },
        },
      });
      expect(tree.children[0]?.children).toHaveLength(1);
    });
  });

  it("does not call Wasm with an empty tree before delayed children register", async () => {
    const capturedTrees: MockTreeNode[] = [];

    layoutEngineMocks.computeLayout.mockImplementation((tree) => {
      capturedTrees.push(JSON.parse(JSON.stringify(tree)) as MockTreeNode);
      return createMockLayoutResult(tree as MockTreeNode);
    });

    render(
      <LayoutProvider debounceMs={0} viewportHeight={600} viewportWidth={800}>
        <DelayedNestedTree />
      </LayoutProvider>,
    );

    await waitFor(() => {
      expect(capturedTrees.length).toBeGreaterThan(0);
      expect(capturedTrees[capturedTrees.length - 1]?.children?.[0]?.children?.[0]?.children?.[0]?.id).toBe(
        "delayed-label",
      );
    });

    expect(capturedTrees.every((tree) => (tree.children?.length ?? 0) > 0)).toBe(true);
  });

  it("waits for nested registrations to settle before calling Wasm in strict mode", async () => {
    const capturedTrees: MockTreeNode[] = [];

    layoutEngineMocks.computeLayout.mockImplementation((tree) => {
      capturedTrees.push(JSON.parse(JSON.stringify(tree)) as MockTreeNode);
      return createMockLayoutResult(tree as MockTreeNode);
    });

    render(
      <React.StrictMode>
        <LayoutProvider debounceMs={0} viewportHeight={600} viewportWidth={800}>
          <ScreenGui Id="strict-screen">
            <Frame Id="strict-frame">
              <TextLabel Id="strict-label" Text="Strict label" />
            </Frame>
          </ScreenGui>
        </LayoutProvider>
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(capturedTrees.length).toBeGreaterThan(0);
      expect(capturedTrees[capturedTrees.length - 1]?.children?.[0]?.children?.[0]?.children?.[0]?.id).toBe(
        "strict-label",
      );
    });

    expect(
      capturedTrees.every(
        (tree) =>
          tree.children?.length === 1 &&
          tree.children[0]?.id === "strict-screen" &&
          tree.children[0]?.children?.length === 1 &&
          tree.children[0]?.children[0]?.id === "strict-frame" &&
          tree.children[0]?.children[0]?.children?.length === 1 &&
          tree.children[0]?.children[0]?.children?.[0]?.id === "strict-label",
      ),
    ).toBe(true);
  });

  it("normalizes nested registry ids and legacy Wasm result keys", async () => {
    layoutEngineMocks.computeLayout.mockImplementation((tree) => {
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0]?.id).toBe("preview-node-100");
      expect(tree.children[0]?.children).toHaveLength(1);
      expect(tree.children[0]?.children[0]?.id).toBe("preview-node-200");

      return {
        __lattice_preview_root__: { height: 480, width: 640, x: 0, y: 0 },
        "screengui:preview-node-100": { height: 240, width: 320, x: 0, y: 0 },
        "frame:preview-node-200": { height: 32, width: 80, x: 11, y: 22 },
      };
    });

    render(
      <LayoutProvider debounceMs={0} viewportHeight={480} viewportWidth={640}>
        <ScreenGui Id="screengui:preview-node-100">
          <Frame Id="frame:preview-node-200" ParentId="screengui:preview-node-100" />
        </ScreenGui>
      </LayoutProvider>,
    );

    const screenGui = document.querySelector('[data-preview-host="screengui"]') as HTMLElement;
    const frame = document.querySelector('[data-preview-host="frame"]') as HTMLElement;

    expect(screenGui.dataset.previewNodeId).toBe("preview-node-100");
    expect(frame.dataset.previewNodeId).toBe("preview-node-200");

    await waitFor(() => {
      expect(frame.style.left).toBe("11px");
      expect(frame.style.top).toBe("22px");
      expect(frame.style.width).toBe("80px");
      expect(frame.style.height).toBe("32px");
    });
  });
});
