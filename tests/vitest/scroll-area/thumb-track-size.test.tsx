// @vitest-environment jsdom

// ScrollArea.Thumb sizes and positions itself as a scale of its track (its
// parent), so it must compute against the track's measured length — not the
// viewport's. Otherwise the 18px minimum thumb is drawn at the wrong size when
// the scrollbar is shorter than the viewport (e.g. inset beside a Corner), and
// the drawn thumb disagrees with the drag / track-click math.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const thumbProps: Record<string, unknown>[] = [];

// The thumb subscribes to UserInputService drag signals at mount; the shared shim has none.
vi.hoisted(() => {
  const signal = () => ({ Connect: () => ({ Disconnect: () => {} }) });
  const userInputService = { InputChanged: signal(), InputEnded: signal() };
  const getService = game.GetService;
  game.GetService = (service: string) =>
    service === "UserInputService" ? userInputService : getService(service);
});

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const react = await import("react");

  // Records the forwarded props and hands the ref the fake thumb instance the
  // child element carries, as Slot would hand it the real Roblox instance.
  function Slot(props: { children?: React.ReactNode } & Record<string, unknown>) {
    const { children, ref, ...forwarded } = props as Record<string, unknown> & { children?: React.ReactNode };
    thumbProps.push(forwarded);
    const instance = react.default.isValidElement(children)
      ? (children.props as { instance?: unknown }).instance
      : undefined;
    react.default.useLayoutEffect(() => {
      (ref as (value: unknown) => void)(instance);
      return () => (ref as (value: unknown) => void)(undefined);
    });
    return null;
  }

  return {
    composeEvents: runtimeProps.composeEvents,
    composeRefs: runtimeRefs.composeRefs,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    getSlotChild: runtimeSlot.getSlotChild,
    toSlotProps: runtimeProps.toSlotProps,
    createStrictContext: strictContext.createStrictContext,
    React: react.default,
    Slot,
  };
});

import { ScrollAreaContextProvider } from "../../../packages/react/scroll-area/src/ScrollArea/context";
import { ScrollAreaThumb } from "../../../packages/react/scroll-area/src/ScrollArea/ScrollAreaThumb";

afterEach(() => {
  cleanup();
  thumbProps.splice(0);
});

function createSignal() {
  const listeners = new Set<() => void>();
  return {
    Connect(listener: () => void) {
      listeners.add(listener);
      return { Disconnect: () => listeners.delete(listener) };
    },
    fire() {
      for (const listener of [...listeners]) listener();
    },
  };
}

function createTrack(length: number) {
  const signals: Record<string, ReturnType<typeof createSignal>> = { AbsoluteSize: createSignal() };
  return {
    AbsoluteSize: new Vector2(10, length),
    IsA: (className: string) => className === "GuiObject",
    GetPropertyChangedSignal: (property: string) => (signals[property] ??= createSignal()),
    resize(nextLength: number) {
      this.AbsoluteSize = new Vector2(10, nextLength);
      signals.AbsoluteSize.fire();
    },
  };
}

function createThumb(track: unknown) {
  return {
    Parent: track,
    IsA: (className: string) => className === "GuiObject",
    GetPropertyChangedSignal: () => createSignal(),
  };
}

function renderThumb(track: ReturnType<typeof createTrack>, scrollPosition: number) {
  const metrics = { viewportSize: 200, contentSize: 10000, scrollPosition };
  const context = {
    vertical: metrics,
    horizontal: { viewportSize: 0, contentSize: 0, scrollPosition: 0 },
    setScrollPosition: vi.fn(),
  };

  render(
    React.createElement(
      ScrollAreaContextProvider,
      { value: context as never },
      React.createElement(
        ScrollAreaThumb as React.ComponentType<Record<string, unknown>>,
        { asChild: true, orientation: "vertical" },
        React.createElement("frame", { instance: createThumb(track) }),
      ),
    ),
  );
}

function latest() {
  const props = thumbProps.at(-1)!;
  return {
    size: (props.Size as { Y: { Scale: number } }).Y.Scale,
    position: (props.Position as { Y: { Scale: number } }).Y.Scale,
  };
}

describe("ScrollArea.Thumb track measurement", () => {
  it("sizes the minimum thumb against the track, not the viewport", () => {
    // A 100px track beside a 200px viewport: the proportional thumb (2px) is
    // clamped to the 18px minimum, which is 18% of the track.
    const track = createTrack(100);
    renderThumb(track, 0);

    expect(latest().size * 100).toBeCloseTo(18);
    expect(latest().position).toBe(0);
  });

  it("ends the thumb at the end of the track when scrolled to the end", () => {
    const track = createTrack(100);
    renderThumb(track, 9800);

    const { position, size } = latest();
    expect(position + size).toBeCloseTo(1);
    expect(size * 100).toBeCloseTo(18);
  });

  it("follows the track when its AbsoluteSize changes", () => {
    const track = createTrack(100);
    renderThumb(track, 0);

    act(() => {
      track.resize(150);
    });

    expect(latest().size * 150).toBeCloseTo(18);
  });
});
