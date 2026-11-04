// @vitest-environment jsdom
// @ts-nocheck

// Progress.Spinner rotates through the motion runtime (useLoopMotion on RenderStepped), not a
// Heartbeat connection of its own, so it follows the motion policy.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runService } = vi.hoisted(() => {
  const renderSteppedListeners = new Set<(dt: number) => void>();
  const heartbeatConnect = vi.fn();

  const runService = {
    RenderStepped: {
      Connect(listener: (dt: number) => void) {
        renderSteppedListeners.add(listener);
        return {
          Disconnect() {
            renderSteppedListeners.delete(listener);
          },
        };
      },
    },
    Heartbeat: { Connect: heartbeatConnect },
    IsStudio() {
      return false;
    },
    heartbeatConnect,
    step(dt: number) {
      for (const listener of [...renderSteppedListeners]) {
        listener(dt);
      }
    },
    reset() {
      renderSteppedListeners.clear();
    },
    listenerCount() {
      return renderSteppedListeners.size;
    },
  };

  (globalThis as Record<string, unknown>).game = {
    GetService: vi.fn((serviceName: string) => (serviceName === "RunService" ? runService : {})),
  } as unknown as DataModel;

  return { runService };
});

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
  const react = await import("react");

  return {
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    getSlotChild: runtimeSlot.getSlotChild,
    React: react.default,
    Slot: () => null,
  };
});

import { MotionProvider } from "@lattice-ui/react-motion";
import { Spinner } from "../../../packages/react/progress/src/Progress/Spinner";

function renderSpinner(props: Record<string, unknown>, disableAllMotion = false) {
  const spinnerRef = { current: undefined as (HTMLElement & Record<string, unknown>) | undefined };
  const view = render(
    <MotionProvider disableAllMotion={disableAllMotion}>
      <Spinner {...props} ref={spinnerRef} />
    </MotionProvider>,
  );
  return { spinnerRef, view };
}

beforeEach(() => {
  runService.reset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Progress.Spinner", () => {
  it("rotates at speedDegPerSecond through the motion scheduler", () => {
    const { spinnerRef } = renderSpinner({ speedDegPerSecond: 90 });

    expect(runService.listenerCount()).toBe(1);
    act(() => {
      runService.step(1);
    });
    expect(spinnerRef.current?.Rotation).toBeCloseTo(90);

    act(() => {
      runService.step(3.5);
    });
    expect(spinnerRef.current?.Rotation).toBeCloseTo(45);
    expect(runService.heartbeatConnect).not.toHaveBeenCalled();
  });

  it("turns the other way for a negative speed", () => {
    const { spinnerRef } = renderSpinner({ speedDegPerSecond: -90 });

    act(() => {
      runService.step(1);
    });
    expect(spinnerRef.current?.Rotation).toBeCloseTo(-90);
  });

  it("does not spin when motion is disabled", () => {
    const { spinnerRef } = renderSpinner({ speedDegPerSecond: 90 }, true);

    expect(runService.listenerCount()).toBe(0);
    act(() => {
      runService.step(1);
    });
    expect(spinnerRef.current?.Rotation).toBe(0);
  });

  it("stops when spinning is false", () => {
    const { spinnerRef, view } = renderSpinner({ speedDegPerSecond: 90 });
    act(() => {
      runService.step(1);
    });

    view.rerender(
      <MotionProvider>
        <Spinner ref={spinnerRef} speedDegPerSecond={90} spinning={false} />
      </MotionProvider>,
    );

    expect(runService.listenerCount()).toBe(0);
    expect(spinnerRef.current?.Rotation).toBe(0);
  });
});
