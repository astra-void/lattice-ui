// @vitest-environment jsdom
// @ts-nocheck

import { act, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { guiService } = vi.hoisted(() => {
  const listeners = new Set<() => void>();

  const guiService = {
    ReducedMotionEnabled: false,
    GetPropertyChangedSignal(_property: string) {
      return {
        Connect(listener: () => void) {
          listeners.add(listener);
          return {
            Disconnect() {
              listeners.delete(listener);
            },
          };
        },
      };
    },
    set(value: boolean) {
      guiService.ReducedMotionEnabled = value;
      for (const listener of [...listeners]) {
        listener();
      }
    },
    reset() {
      guiService.ReducedMotionEnabled = false;
      listeners.clear();
    },
  };

  (globalThis as Record<string, unknown>).game = {
    GetService: vi.fn((serviceName: string) => {
      if (serviceName === "GuiService") {
        return guiService;
      }
      return {};
    }),
  } as unknown as DataModel;

  return { guiService };
});

vi.mock("@lattice-ui/react-runtime", () => ({
  React: require("react"),
}));

import { MotionProvider, useMotionPolicy } from "@lattice-ui/react-motion";

function PolicyProbe(props: { onPolicy: (policy: ReturnType<typeof useMotionPolicy>) => void }) {
  const policy = useMotionPolicy();
  props.onPolicy(policy);
  return null;
}

beforeEach(() => {
  guiService.reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("system reduced motion policy", () => {
  it("disables motion when the platform reduced-motion setting is enabled, without a provider", () => {
    guiService.ReducedMotionEnabled = true;

    let policy: ReturnType<typeof useMotionPolicy> | undefined;
    render(<PolicyProbe onPolicy={(value) => (policy = value)} />);

    expect(policy?.disableAllMotion).toBe(true);
    expect(policy?.mode).toBe("none");
  });

  it("ignores the platform setting when respectSystemReducedMotion is false", () => {
    guiService.ReducedMotionEnabled = true;

    let policy: ReturnType<typeof useMotionPolicy> | undefined;
    render(
      <MotionProvider respectSystemReducedMotion={false}>
        <PolicyProbe onPolicy={(value) => (policy = value)} />
      </MotionProvider>,
    );

    expect(policy?.disableAllMotion).toBe(false);
    expect(policy?.mode).toBe("full");
  });

  it("reacts to platform reduced-motion changes", () => {
    let policy: ReturnType<typeof useMotionPolicy> | undefined;
    render(<PolicyProbe onPolicy={(value) => (policy = value)} />);

    expect(policy?.disableAllMotion).toBe(false);

    act(() => {
      guiService.set(true);
    });

    expect(policy?.disableAllMotion).toBe(true);
    expect(policy?.mode).toBe("none");
  });
});
