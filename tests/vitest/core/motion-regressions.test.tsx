// @vitest-environment jsdom
// @ts-nocheck

import { act, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/core", () => ({
  React: require("react"),
}));

import { useMotionPresence } from "@lattice-ui/motion";

function PresenceHarness(props: {
  present: boolean;
  onSnapshot: (snapshot: ReturnType<typeof useMotionPresence>) => void;
}) {
  const snapshot = useMotionPresence({ present: props.present, appear: true });
  props.onSnapshot(snapshot);
  return snapshot.isPresent ? React.createElement("div", { "data-testid": "present" }) : null;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("motion regression coverage", () => {
  it("keeps presence mounted through exit until the exit phase completes", () => {
    let latestSnapshot: ReturnType<typeof useMotionPresence> | undefined;

    const { queryByTestId, rerender } = render(
      React.createElement(PresenceHarness, {
        present: true,
        onSnapshot: (snapshot) => {
          latestSnapshot = snapshot;
        },
      }),
    );

    expect(queryByTestId("present")).not.toBeNull();
    expect(latestSnapshot?.phase).toBe("entering");

    act(() => {
      latestSnapshot?.markPhaseComplete("entering");
    });

    expect(latestSnapshot?.phase).toBe("entered");

    rerender(
      React.createElement(PresenceHarness, {
        present: false,
        onSnapshot: (snapshot) => {
          latestSnapshot = snapshot;
        },
      }),
    );

    expect(latestSnapshot?.phase).toBe("exiting");
    expect(queryByTestId("present")).not.toBeNull();

    act(() => {
      latestSnapshot?.markPhaseComplete("exiting");
    });

    expect(latestSnapshot?.phase).toBe("unmounted");
    expect(queryByTestId("present")).toBeNull();
  });

  it("re-enters safely if presence flips back on before exit completes", () => {
    let latestSnapshot: ReturnType<typeof useMotionPresence> | undefined;

    const { rerender } = render(
      React.createElement(PresenceHarness, {
        present: true,
        onSnapshot: (snapshot) => {
          latestSnapshot = snapshot;
        },
      }),
    );

    act(() => {
      latestSnapshot?.markPhaseComplete("entering");
    });

    rerender(
      React.createElement(PresenceHarness, {
        present: false,
        onSnapshot: (snapshot) => {
          latestSnapshot = snapshot;
        },
      }),
    );

    expect(latestSnapshot?.phase).toBe("exiting");

    rerender(
      React.createElement(PresenceHarness, {
        present: true,
        onSnapshot: (snapshot) => {
          latestSnapshot = snapshot;
        },
      }),
    );

    expect(latestSnapshot?.phase).toBe("entering");
  });
});
