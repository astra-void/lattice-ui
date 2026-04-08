// @vitest-environment jsdom
// @ts-nocheck

import { act, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/core", () => ({
  React: require("react"),
  createStrictContext: <T,>(_name: string) => {
    const React = require("react");
    const Context = React.createContext<T | undefined>(undefined);
    const Provider = Context.Provider;
    const useContext = () => {
      const value = React.useContext(Context);
      if (value === undefined) {
        throw new Error("Missing context");
      }
      return value;
    };
    return [Provider, useContext] as const;
  },
}));

import { Presence } from "@lattice-ui/layer";

function PresenceHarness(props: {
  present: boolean;
  onSnapshot: (snapshot: { isPresent: boolean; onExitComplete: () => void }) => void;
  exitFallbackMs?: number;
}) {
  return (
    <Presence
      exitFallbackMs={props.exitFallbackMs}
      present={props.present}
      render={(snapshot) => {
        props.onSnapshot(snapshot);
        return React.createElement("div", {
          "data-testid": "present",
          "data-state": snapshot.isPresent ? "present" : "exiting",
        });
      }}
    />
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("presence regression coverage", () => {
  it("keeps content mounted through exit until the exit completion callback runs", () => {
    let latestSnapshot: { isPresent: boolean; onExitComplete: () => void } | undefined;

    const { queryByTestId, rerender } = render(
      <PresenceHarness
        onSnapshot={(snapshot) => {
          latestSnapshot = snapshot;
        }}
        present={true}
      />,
    );

    expect(queryByTestId("present")).not.toBeNull();
    expect(latestSnapshot?.isPresent).toBe(true);
    expect(queryByTestId("present")?.getAttribute("data-state")).toBe("present");

    rerender(
      <PresenceHarness
        onSnapshot={(snapshot) => {
          latestSnapshot = snapshot;
        }}
        present={false}
      />,
    );

    expect(latestSnapshot?.isPresent).toBe(false);
    expect(queryByTestId("present")).not.toBeNull();
    expect(queryByTestId("present")?.getAttribute("data-state")).toBe("exiting");

    act(() => {
      latestSnapshot?.onExitComplete();
    });

    expect(queryByTestId("present")).toBeNull();
  });

  it("falls back to unmounting if exit completion never fires", () => {
    let latestSnapshot: { isPresent: boolean; onExitComplete: () => void } | undefined;

    const { queryByTestId, rerender } = render(
      <PresenceHarness
        exitFallbackMs={25}
        onSnapshot={(snapshot) => {
          latestSnapshot = snapshot;
        }}
        present={true}
      />,
    );

    rerender(
      <PresenceHarness
        exitFallbackMs={25}
        onSnapshot={(snapshot) => {
          latestSnapshot = snapshot;
        }}
        present={false}
      />,
    );

    expect(latestSnapshot?.isPresent).toBe(false);
    expect(queryByTestId("present")).not.toBeNull();
    expect(queryByTestId("present")?.getAttribute("data-state")).toBe("exiting");

    act(() => {
      vi.advanceTimersByTime(25);
    });

    expect(queryByTestId("present")).toBeNull();
  });
});
