// @vitest-environment jsdom

// Tests the REAL Slot implementation (no @lattice-ui/react-runtime mock). At Roblox
// runtime, @rbxts/react's patched createElement normalizes a host child's
// Event/Change tables into tag-keyed props (props[React.Event[name]]) and
// clears props.Event before Slot ever sees the element. We emulate that here
// by installing Event/Change key maps on the aliased react module and by
// constructing children whose handlers already live at the tag keys.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Slot } from "../../../packages/react/runtime/src/slot";
import { getElementRef, toRef } from "../../../packages/react/runtime/src/refs";

const EVENT_ACTIVATED = "__REACT_EVENT_Activated";
const CHANGE_ABSOLUTE_SIZE = "__REACT_CHANGE_AbsoluteSize";

type MutableReact = typeof React & {
  Event?: Record<string, string>;
  Change?: Record<string, string>;
};

beforeEach(() => {
  (React as MutableReact).Event = { Activated: EVENT_ACTIVATED };
  (React as MutableReact).Change = { AbsoluteSize: CHANGE_ABSOLUTE_SIZE };
});

afterEach(() => {
  delete (React as MutableReact).Event;
  delete (React as MutableReact).Change;
  cleanup();
});

let receivedProps: Record<string, unknown> | undefined;

function Probe(props: Record<string, unknown>) {
  receivedProps = props;
  return null;
}

describe("Slot event merging", () => {
  it("composes with a host child's tag-keyed handler instead of clobbering it", () => {
    const calls: string[] = [];
    const childHandler = vi.fn(() => calls.push("child"));
    const slotHandler = vi.fn(() => calls.push("slot"));

    // Emulates a JSX host child after @rbxts/react createElement
    // normalization: handler at the tag key, no props.Event table.
    const child = React.createElement(Probe, { [EVENT_ACTIVATED]: childHandler });

    render(React.createElement(Slot, { Event: { Activated: slotHandler } }, child));

    const merged = receivedProps?.[EVENT_ACTIVATED] as (...args: unknown[]) => void;
    expect(typeof merged).toBe("function");

    merged("rbx", 1);

    expect(childHandler).toHaveBeenCalledWith("rbx", 1);
    expect(slotHandler).toHaveBeenCalledWith("rbx", 1);
    expect(calls).toEqual(["child", "slot"]);
  });

  it("composes Change handlers at tag keys the same way", () => {
    const childHandler = vi.fn();
    const slotHandler = vi.fn();
    const child = React.createElement(Probe, { [CHANGE_ABSOLUTE_SIZE]: childHandler });

    render(React.createElement(Slot, { Change: { AbsoluteSize: slotHandler } }, child));

    const merged = receivedProps?.[CHANGE_ABSOLUTE_SIZE] as (...args: unknown[]) => void;
    merged("rbx");

    expect(childHandler).toHaveBeenCalledTimes(1);
    expect(slotHandler).toHaveBeenCalledTimes(1);
  });

  it("still merges un-normalized Event tables (composite child path)", () => {
    const calls: string[] = [];
    const childHandler = vi.fn(() => calls.push("child"));
    const slotHandler = vi.fn(() => calls.push("slot"));
    const child = React.createElement(Probe, { Event: { Activated: childHandler } });

    render(React.createElement(Slot, { Event: { Activated: slotHandler } }, child));

    const merged = receivedProps?.[EVENT_ACTIVATED] as (...args: unknown[]) => void;
    expect(typeof merged).toBe("function");

    merged();

    expect(calls).toEqual(["child", "slot"]);
  });

  it("keeps the child's tag-keyed handler when the slot has no handler for it", () => {
    const childHandler = vi.fn();
    const child = React.createElement(Probe, { [EVENT_ACTIVATED]: childHandler });

    render(React.createElement(Slot, {}, child));

    expect(receivedProps?.[EVENT_ACTIVATED]).toBe(childHandler);
  });

  it("passes the slot handler through when the child has none", () => {
    const slotHandler = vi.fn();
    const child = React.createElement(Probe, {});

    render(React.createElement(Slot, { Event: { Activated: slotHandler } }, child));

    expect(receivedProps?.[EVENT_ACTIVATED]).toBe(slotHandler);
  });
});

describe("ref sentinel filtering", () => {
  it("toRef rejects the react-lua dev warning sentinel", () => {
    expect(toRef({ isReactWarning: true })).toBeUndefined();
  });

  it("getElementRef falls back to element.ref when props.ref is the sentinel", () => {
    const realRef = { current: undefined };
    const elementLike = {
      props: { ref: { isReactWarning: true } },
      ref: realRef,
    } as unknown as React.ReactElement;

    expect(getElementRef(elementLike)).toBe(realRef);
  });

  it("getElementRef still prefers a genuine props.ref", () => {
    const propsRef = { current: undefined };
    const elementRef = { current: undefined };
    const elementLike = {
      props: { ref: propsRef },
      ref: elementRef,
    } as unknown as React.ReactElement;

    expect(getElementRef(elementLike)).toBe(propsRef);
  });
});
