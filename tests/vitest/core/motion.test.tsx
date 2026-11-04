// @vitest-environment jsdom
// @ts-nocheck

import { act, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runService } = vi.hoisted(() => {
  const renderSteppedListeners = new Set<(dt: number) => void>();
  const workspace = {};

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
    IsStudio() {
      return false;
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

  (globalThis as Record<string, unknown>).game = {
    GetService: vi.fn((serviceName: string) => {
      if (serviceName === "RunService") {
        return runService;
      }
      if (serviceName === "Workspace") {
        return workspace;
      }
      return {};
    }),
  } as unknown as DataModel;

  return { runService };
});

vi.mock("@lattice-ui/react-runtime", () => ({
  React: require("react"),
}));

import {
  MotionProvider,
  motionTargets,
  type PresenceMotionConfig,
  usePresenceMotion,
  useResponseMotion,
} from "@lattice-ui/react-motion";

// The package ships no presence recipes, so the tests build the consumer-owned config they animate.
function createSurfaceReveal(offsetY: number, duration: number): PresenceMotionConfig {
  return {
    target: motionTargets.offsetWrapper("surface reveal"),
    initial: { Position: UDim2.fromOffset(0, offsetY), BackgroundTransparency: 1 },
    reveal: {
      values: { Position: UDim2.fromOffset(0, 0), BackgroundTransparency: 0 },
      intent: { duration, tempo: "swift", tone: "calm" },
    },
    exit: {
      values: { Position: UDim2.fromOffset(0, offsetY), BackgroundTransparency: 1 },
      intent: { duration: duration * 0.8, tempo: "swift", tone: "calm" },
    },
  };
}

function PresenceHarness(props: {
  present: boolean;
  config: PresenceMotionConfig;
  instance: Record<string, unknown>;
  onExitComplete?: () => void;
}) {
  const ref = usePresenceMotion(props.present, props.config, props.onExitComplete);
  if (ref.current !== props.instance) {
    ref.current = props.instance as unknown as Instance;
  }
  return null;
}

function ResponseHarness(props: { active: boolean; instance: Record<string, unknown> }) {
  const ref = useResponseMotion(
    props.active,
    {
      active: { BackgroundTransparency: 0 },
      inactive: { BackgroundTransparency: 1 },
    },
    { settle: { duration: 0.2, tempo: "steady", tone: "responsive" } },
  );

  if (ref.current !== props.instance) {
    ref.current = props.instance as unknown as Instance;
  }

  return null;
}

function MotionProviderHarness(props: {
  active: boolean;
  instance: Record<string, unknown>;
  disableAllMotion?: boolean;
}) {
  return (
    <MotionProvider disableAllMotion={props.disableAllMotion === true}>
      <ResponseHarness active={props.active} instance={props.instance} />
    </MotionProvider>
  );
}

beforeEach(() => {
  runService.reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("motion hooks", () => {
  it("applies initial presence properties immediately and settles reveal on render step", () => {
    const instance = {
      Position: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 1,
    };
    const config = createSurfaceReveal(8, 0.12);

    render(<PresenceHarness config={config} instance={instance} present={true} />);

    expect(instance.Position).toEqual(UDim2.fromOffset(0, 8));
    expect(instance.BackgroundTransparency).toBe(1);
    expect(runService.listenerCount()).toBe(1);

    act(() => {
      runService.step(1);
    });

    expect(instance.Position).toEqual(UDim2.fromOffset(0, 0));
    expect(instance.BackgroundTransparency).toBe(0);
    expect(runService.listenerCount()).toBe(0);
  });

  it("does not restart the reveal when re-rendered with a fresh config object mid-reveal", () => {
    const instance = {
      Position: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 1,
    };

    const { rerender } = render(
      <PresenceHarness config={createSurfaceReveal(8, 0.5)} instance={instance} present={true} />,
    );

    act(() => {
      runService.step(0.05);
    });
    const midTransparency = instance.BackgroundTransparency;
    expect(midTransparency).toBeLessThan(1);

    rerender(<PresenceHarness config={createSurfaceReveal(8, 0.5)} instance={instance} present={true} />);

    expect(instance.BackgroundTransparency).toBe(midTransparency);
    expect(instance.Position).not.toEqual(UDim2.fromOffset(0, 8));

    act(() => {
      runService.step(1);
    });

    expect(instance.BackgroundTransparency).toBe(0);
    expect(instance.Position).toEqual(UDim2.fromOffset(0, 0));
  });

  it("reverses from the current values when reopened mid-exit instead of snapping to initial", () => {
    const instance = {
      Position: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 1,
    };
    const config = createSurfaceReveal(8, 0.5);

    const { rerender } = render(<PresenceHarness config={config} instance={instance} present={true} />);
    act(() => {
      runService.step(1);
    });
    expect(instance.BackgroundTransparency).toBe(0);

    rerender(<PresenceHarness config={config} instance={instance} present={false} />);
    act(() => {
      runService.step(0.03);
    });
    const midTransparency = instance.BackgroundTransparency;
    expect(midTransparency).toBeGreaterThan(0);
    expect(midTransparency).toBeLessThan(1);

    rerender(<PresenceHarness config={config} instance={instance} present={true} />);

    expect(instance.BackgroundTransparency).toBe(midTransparency);

    act(() => {
      runService.step(1);
    });

    expect(instance.BackgroundTransparency).toBe(0);
  });

  it("keeps exit mounted until hide motion completes and then fires onExitComplete", async () => {
    const instance = {
      Position: UDim2.fromOffset(0, 0),
      BackgroundTransparency: 1,
    };
    const config = createSurfaceReveal(6, 0.1);
    const onExitComplete = vi.fn();

    const { rerender } = render(
      <PresenceHarness config={config} instance={instance} onExitComplete={onExitComplete} present={true} />,
    );

    act(() => {
      runService.step(1);
    });

    rerender(<PresenceHarness config={config} instance={instance} onExitComplete={onExitComplete} present={false} />);

    expect(onExitComplete).not.toHaveBeenCalled();

    await act(async () => {
      runService.step(1);
      await Promise.resolve();
    });

    expect(instance.BackgroundTransparency).toBe(1);
    expect(onExitComplete).toHaveBeenCalledTimes(1);
    expect(runService.listenerCount()).toBe(0);
  });

  it("short-circuits response motion when motion is disabled", () => {
    const instance = {
      BackgroundTransparency: 1,
    };

    render(<MotionProviderHarness active={true} disableAllMotion={true} instance={instance} />);

    expect(instance.BackgroundTransparency).toBe(0);
    expect(runService.listenerCount()).toBe(0);
  });
});
