// @vitest-environment jsdom
// @ts-nocheck

import { act, render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

class MockConnection {
  Disconnect() {}
}

const mockWorkspace = {
  CurrentCamera: { ViewportSize: new Vector2(1920, 1080) },
  GetPropertyChangedSignal: () => ({ Connect: () => new MockConnection() }),
};
let heartbeatCallback: (() => void) | null = null;
const mockRunService = {
  Heartbeat: {
    Connect: (cb: () => void) => {
      heartbeatCallback = cb;
      return new MockConnection();
    },
  },
};

globalThis.game = {
  GetService: (service: string) => {
    if (service === "Workspace") return mockWorkspace;
    if (service === "RunService") return mockRunService;
    if (service === "GuiService") return { GetGuiInset: () => [new Vector2(0, 36), new Vector2(0, 0)] };
    return {};
  },
};

vi.mock("@lattice-ui/core", () => ({ React: require("react") }));

import { usePopper } from "../../../packages/popper/src/usePopper";

describe("Popover flip and clamp regression (consumer level)", () => {
  it("propagates resolved placement with side/align offsets through consumer state", () => {
    let currentResult: ReturnType<typeof usePopper> | null = null;

    function TestConsumer({ anchorPos, placement }) {
      const anchorRef = React.useRef({
        AbsolutePosition: anchorPos,
        AbsoluteSize: new Vector2(100, 30),
        IsA: (type) => type === "GuiObject",
        GetPropertyChangedSignal: () => ({ Connect: () => new MockConnection() }),
      });
      const contentRef = React.useRef({
        AbsolutePosition: new Vector2(0, 0),
        AbsoluteSize: new Vector2(200, 100),
        IsA: (type) => type === "GuiObject",
        GetPropertyChangedSignal: () => ({ Connect: () => new MockConnection() }),
      });

      anchorRef.current.AbsolutePosition = anchorPos;

      const popper = usePopper({
        anchorRef,
        contentRef,
        alignOffset: 8,
        collisionPadding: 10,
        placement,
        sideOffset: 10,
        enabled: true,
      });

      currentResult = popper;

      return null;
    }

    const { rerender } = render(<TestConsumer anchorPos={new Vector2(1900, 1060)} placement="bottom" />);

    act(() => {
      if (heartbeatCallback) heartbeatCallback();
    });

    expect(currentResult.placement).toBe("left");
    expect(currentResult.anchorPoint.X).toBe(1);
    expect(currentResult.anchorPoint.Y).toBe(0.5);

    expect(currentResult.position.X.Offset).toBe(1890);
    expect(currentResult.position.Y.Offset).toBe(1020);

    // move anchor around to encourage right-side fallback without clamping cross-axis
    rerender(<TestConsumer anchorPos={new Vector2(10, 200)} placement="bottom" />);
    act(() => {
      currentResult.update();
      if (heartbeatCallback) heartbeatCallback();
    });

    expect(currentResult.placement).toBe("right");
    expect(currentResult.anchorPoint.X).toBe(0);
    expect(currentResult.anchorPoint.Y).toBe(0.5);
    expect(currentResult.position.X.Offset).toBe(120);
    expect(currentResult.position.Y.Offset).toBe(223);
  });

  it("keeps bottom placement centered when using sideOffset", () => {
    let currentResult: ReturnType<typeof usePopper> | null = null;

    function TestConsumer({ sideOffset }: { sideOffset?: number }) {
      const anchorRef = React.useRef({
        AbsolutePosition: new Vector2(300, 200),
        AbsoluteSize: new Vector2(100, 30),
        IsA: (type: string) => type === "GuiObject",
        GetPropertyChangedSignal: () => ({ Connect: () => new MockConnection() }),
      });
      const contentRef = React.useRef({
        AbsolutePosition: new Vector2(0, 0),
        AbsoluteSize: new Vector2(200, 100),
        IsA: (type: string) => type === "GuiObject",
        GetPropertyChangedSignal: () => ({ Connect: () => new MockConnection() }),
      });

      const popper = usePopper({
        anchorRef,
        contentRef,
        placement: "bottom",
        sideOffset,
        collisionPadding: 10,
        enabled: true,
      });

      currentResult = popper;
      return null;
    }

    const { rerender } = render(<TestConsumer />);

    act(() => {
      if (heartbeatCallback) heartbeatCallback();
    });

    const centeredX = currentResult.position.X.Offset;
    const baselineY = currentResult.position.Y.Offset;

    rerender(<TestConsumer sideOffset={8} />);
    act(() => {
      if (heartbeatCallback) heartbeatCallback();
    });

    expect(currentResult.placement).toBe("bottom");
    expect(currentResult.anchorPoint).toEqual(new Vector2(0.5, 0));
    expect(currentResult.position.X.Offset).toBe(centeredX);
    expect(currentResult.position.Y.Offset).toBe(baselineY + 8);
  });
});
