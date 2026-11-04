// @vitest-environment jsdom
// @ts-nocheck

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runService, guiService } = vi.hoisted(() => {
  const renderSteppedListeners = new Set<(dt: number) => void>();
  const reducedMotionListeners = new Set<() => void>();

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

  const guiService = {
    ReducedMotionEnabled: false,
    GetPropertyChangedSignal(_property: string) {
      return {
        Connect(listener: () => void) {
          reducedMotionListeners.add(listener);
          return {
            Disconnect() {
              reducedMotionListeners.delete(listener);
            },
          };
        },
      };
    },
    set(value: boolean) {
      guiService.ReducedMotionEnabled = value;
      for (const listener of [...reducedMotionListeners]) {
        listener();
      }
    },
    reset() {
      guiService.ReducedMotionEnabled = false;
      reducedMotionListeners.clear();
    },
  };

  (globalThis as Record<string, unknown>).game = {
    GetService: vi.fn((serviceName: string) => {
      if (serviceName === "RunService") {
        return runService;
      }
      if (serviceName === "GuiService") {
        return guiService;
      }
      return {};
    }),
  } as unknown as DataModel;

  return { runService, guiService };
});

vi.mock("@lattice-ui/react-runtime", () => ({
  React: require("react"),
}));

import { type LoopMotionConfig, MotionProvider, useLoopMotion } from "@lattice-ui/react-motion";

function LoopHarness(props: { active: boolean; config: LoopMotionConfig; instance: Record<string, unknown> }) {
  const ref = useLoopMotion(props.active, props.config);
  if (ref.current !== props.instance) {
    ref.current = props.instance as unknown as Instance;
  }
  return null;
}

const spin = (duration: number): LoopMotionConfig => ({
  from: { Rotation: 0 },
  to: { Rotation: 360 },
  duration,
});

beforeEach(() => {
  runService.reset();
  guiService.reset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useLoopMotion", () => {
  it("advances the property every render step and wraps at the end of a cycle", () => {
    const instance = { Rotation: 0 };

    render(<LoopHarness active={true} config={spin(2)} instance={instance} />);
    expect(runService.listenerCount()).toBe(1);

    act(() => {
      runService.step(0.5);
    });
    expect(instance.Rotation).toBeCloseTo(90);

    act(() => {
      runService.step(1);
    });
    expect(instance.Rotation).toBeCloseTo(270);

    act(() => {
      runService.step(1);
    });
    expect(instance.Rotation).toBeCloseTo(90);
    // A loop never settles on its own.
    expect(runService.listenerCount()).toBe(1);
  });

  it("plays every other cycle backwards with repeat reverse", () => {
    const instance = { BackgroundTransparency: 0 };
    const config = {
      from: { BackgroundTransparency: 0 },
      to: { BackgroundTransparency: 1 },
      duration: 1,
      repeat: "reverse",
    };

    render(<LoopHarness active={true} config={config} instance={instance} />);

    act(() => {
      runService.step(0.75);
    });
    expect(instance.BackgroundTransparency).toBeCloseTo(0.75);

    act(() => {
      runService.step(0.5);
    });
    expect(instance.BackgroundTransparency).toBeCloseTo(0.75);

    act(() => {
      runService.step(0.5);
    });
    expect(instance.BackgroundTransparency).toBeCloseTo(0.25);
  });

  it("keeps the running cycle when re-rendered with a fresh config, and keeps the phase on a new duration", () => {
    const instance = { Rotation: 0 };

    const { rerender } = render(<LoopHarness active={true} config={spin(2)} instance={instance} />);
    act(() => {
      runService.step(0.5);
    });
    expect(instance.Rotation).toBeCloseTo(90);

    rerender(<LoopHarness active={true} config={spin(2)} instance={instance} />);
    expect(instance.Rotation).toBeCloseTo(90);

    rerender(<LoopHarness active={true} config={spin(1)} instance={instance} />);
    act(() => {
      runService.step(0.25);
    });
    expect(instance.Rotation).toBeCloseTo(180);
  });

  it("stops and rests at from when deactivated", () => {
    const instance = { Rotation: 0 };

    const { rerender } = render(<LoopHarness active={true} config={spin(2)} instance={instance} />);
    act(() => {
      runService.step(0.5);
    });
    expect(instance.Rotation).toBeCloseTo(90);

    rerender(<LoopHarness active={false} config={spin(2)} instance={instance} />);
    expect(instance.Rotation).toBe(0);
    expect(runService.listenerCount()).toBe(0);
  });

  it("does not loop when MotionProvider disables motion", () => {
    const instance = { Rotation: 45 };

    render(
      <MotionProvider disableAllMotion={true}>
        <LoopHarness active={true} config={spin(2)} instance={instance} />
      </MotionProvider>,
    );

    expect(instance.Rotation).toBe(0);
    expect(runService.listenerCount()).toBe(0);
  });

  it("stops when the platform reduced-motion setting turns on and resumes when it turns off", () => {
    const instance = { Rotation: 0 };

    render(<LoopHarness active={true} config={spin(2)} instance={instance} />);
    act(() => {
      runService.step(0.5);
    });
    expect(instance.Rotation).toBeCloseTo(90);

    act(() => {
      guiService.set(true);
    });
    expect(instance.Rotation).toBe(0);
    expect(runService.listenerCount()).toBe(0);

    act(() => {
      guiService.set(false);
    });
    expect(runService.listenerCount()).toBe(1);
    act(() => {
      runService.step(0.5);
    });
    expect(instance.Rotation).toBeCloseTo(90);
  });

  it("disconnects from the scheduler on unmount", () => {
    const instance = { Rotation: 0 };

    const { unmount } = render(<LoopHarness active={true} config={spin(2)} instance={instance} />);
    expect(runService.listenerCount()).toBe(1);

    unmount();
    expect(runService.listenerCount()).toBe(0);
  });
});
