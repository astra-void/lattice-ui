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
let heartbeatCallback: any = null;
const mockRunService = {
  Heartbeat: {
    Connect: (cb: any) => {
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
  it("resolves placement and propagates AnchorPoint/Position properly to Content", () => {
    let currentResult: any = null;

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

      const popper = usePopper({
        anchorRef,
        contentRef,
        placement,
        padding: 10,
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

    expect(currentResult.position.X.Offset).toBe(1900);
    expect(currentResult.position.Y.Offset).toBe(1020);

    // move anchor around corner
    render(<TestConsumer anchorPos={new Vector2(10, 10)} placement="bottom" />);
    act(() => {
      if (heartbeatCallback) heartbeatCallback();
    });

    expect(currentResult.placement).toBe("right");
    expect(currentResult.anchorPoint.X).toBe(0);
    expect(currentResult.anchorPoint.Y).toBe(0.5);
    expect(currentResult.position.X.Offset).toBe(110);
    expect(currentResult.position.Y.Offset).toBe(60);
  });
});
