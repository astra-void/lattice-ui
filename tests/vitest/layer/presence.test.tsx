// @vitest-environment jsdom

// Tests the REAL Presence implementation. The exit fallback is a safety net
// for animations whose onExitComplete never fires; it must not race ahead of
// healthy default exit transitions (the longest default exit is the dialog's
// 300ms canvas-group reveal).

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The core package index re-exports `react.ts`, whose `import = require`
// syntax does not survive the vitest ESM transform. Presence only needs the
// React re-export, so map it to the aliased react module; everything under
// test here (Presence, constants) is the real implementation.
vi.mock("@lattice-ui/react-runtime", async () => {
  const react = await import("react");
  return { React: react.default };
});

import { Presence } from "../../../packages/react/layer/src/presence/Presence";
import { DEFAULT_PRESENCE_EXIT_FALLBACK_MS } from "../../../packages/react/layer/src/internals/constants";

const LONGEST_DEFAULT_EXIT_MS = 300;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

type Rendered = {
  isPresent: boolean;
  onExitComplete: () => void;
};

function renderPresence(present: boolean) {
  let latest: Rendered | undefined;
  let mounted = false;

  const view = render(
    React.createElement(Presence, {
      present,
      render: (state: Rendered) => {
        latest = state;
        mounted = true;
        return null;
      },
    }),
  );

  return {
    view,
    getLatest: () => latest,
    isMounted: () => mounted,
    resetMounted: () => {
      mounted = false;
    },
    setPresent(nextPresent: boolean) {
      view.rerender(
        React.createElement(Presence, {
          present: nextPresent,
          render: (state: Rendered) => {
            latest = state;
            mounted = true;
            return null;
          },
        }),
      );
    },
  };
}

describe("Presence exit fallback", () => {
  it("default fallback comfortably exceeds the longest default exit transition", () => {
    expect(DEFAULT_PRESENCE_EXIT_FALLBACK_MS).toBeGreaterThan(LONGEST_DEFAULT_EXIT_MS);
  });

  it("keeps the child mounted through a healthy 300ms exit animation", () => {
    const harness = renderPresence(true);

    act(() => {
      harness.setPresent(false);
    });

    // Simulate the exit animation still running at 300ms: no force-unmount.
    harness.resetMounted();
    act(() => {
      vi.advanceTimersByTime(LONGEST_DEFAULT_EXIT_MS);
      harness.view.rerender(
        React.createElement(Presence, {
          present: false,
          render: () => {
            harness.resetMounted();
            return null;
          },
        }),
      );
    });

    // The animation completes and reports back — Presence unmounts cleanly.
    const state = harness.getLatest();
    expect(state).toBeDefined();
    expect(state!.isPresent).toBe(false);

    act(() => {
      state!.onExitComplete();
    });

    harness.resetMounted();
    harness.view.rerender(
      React.createElement(Presence, {
        present: false,
        render: () => {
          harness.resetMounted();
          return null;
        },
      }),
    );
    // After onExitComplete the render prop must no longer be invoked.
    expect(harness.isMounted()).toBe(false);
  });

  it("force-unmounts via the fallback when the exit animation never completes", () => {
    const harness = renderPresence(true);
    const onExitComplete = vi.fn();

    act(() => {
      harness.view.rerender(
        React.createElement(Presence, {
          present: false,
          onExitComplete,
          render: () => null,
        }),
      );
    });

    expect(onExitComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DEFAULT_PRESENCE_EXIT_FALLBACK_MS + 50);
    });

    expect(onExitComplete).toHaveBeenCalledTimes(1);
  });

  it("cancels the fallback when the child re-enters before it fires", () => {
    const harness = renderPresence(true);
    const onExitComplete = vi.fn();

    act(() => {
      harness.view.rerender(
        React.createElement(Presence, {
          present: false,
          onExitComplete,
          render: () => null,
        }),
      );
    });

    act(() => {
      harness.view.rerender(
        React.createElement(Presence, {
          present: true,
          onExitComplete,
          render: () => null,
        }),
      );
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_PRESENCE_EXIT_FALLBACK_MS * 2);
    });

    expect(onExitComplete).not.toHaveBeenCalled();
  });

  it("honors an explicit exitFallbackMs override", () => {
    const onExitComplete = vi.fn();
    const view = render(
      React.createElement(Presence, {
        present: true,
        exitFallbackMs: 2000,
        onExitComplete,
        render: () => null,
      }),
    );

    act(() => {
      view.rerender(
        React.createElement(Presence, {
          present: false,
          exitFallbackMs: 2000,
          onExitComplete,
          render: () => null,
        }),
      );
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(onExitComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onExitComplete).toHaveBeenCalledTimes(1);
  });
});
