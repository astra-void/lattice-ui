// @vitest-environment jsdom

// A Tailwind-style transform (vela-rbxts) lowers `className` at the call site into Roblox props
// plus UI modifier children, so an `asChild` part can receive `<uicorner/>` as a SIBLING of the
// element the consumer wrote. Slot has to clone the consumer's element, not the modifier, and the
// modifier has to end up underneath it rather than being dropped.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { getSlotChild, resolveSlotChildren, Slot } from "../../../packages/react/runtime/src/slot";

afterEach(cleanup);

afterEach(() => {
  receivedProps = undefined;
});

let receivedProps: Record<string, unknown> | undefined;

function Probe(props: Record<string, unknown>) {
  receivedProps = props;
  return null;
}

describe("resolveSlotChildren", () => {
  it("treats a lone element as the target", () => {
    const { target, modifiers } = resolveSlotChildren(<Probe />);
    expect(target).toBeTruthy();
    expect(modifiers).toHaveLength(0);
  });

  it("picks the non-modifier element out of a modifier-prefixed subtree", () => {
    const { target, modifiers } = resolveSlotChildren(
      <>
        {React.createElement("uicorner", { key: "c" })}
        {React.createElement("uipadding", { key: "p" })}
        <Probe />
      </>,
    );

    expect((target as React.ReactElement).type).toBe(Probe);
    expect(modifiers).toHaveLength(2);
  });

  it("looks through a fragment holding a single element", () => {
    expect(
      getSlotChild(
        <>
          <Probe />
        </>,
      ),
    ).toBeTruthy();
  });

  it("still refuses two real candidates", () => {
    expect(
      getSlotChild(
        <>
          <Probe />
          <Probe />
        </>,
      ),
    ).toBeUndefined();
  });

  it("refuses a subtree with modifiers but no element to clone", () => {
    expect(getSlotChild(React.createElement("uicorner"))).toBeUndefined();
  });
});

describe("Slot with modifier siblings", () => {
  it("clones the consumer's element and re-parents the modifiers under it", () => {
    render(
      <Slot BackgroundColor3="red">
        {React.createElement("uicorner", { key: "c" })}
        <Probe>
          <span data-testid="own" />
        </Probe>
      </Slot>,
    );

    // The slot props landed on the consumer's element, not on the uicorner.
    expect(receivedProps?.BackgroundColor3).toBe("red");

    const children = React.Children.toArray(receivedProps?.children as React.ReactNode);
    expect(children).toHaveLength(2);
    expect((children[0] as React.ReactElement).type).toBe("uicorner");
    // The element's own children survive alongside the injected modifier.
    expect((children[1] as React.ReactElement).type).toBe("span");
  });

  it("leaves children untouched when there are no modifiers", () => {
    render(
      <Slot BackgroundColor3="red">
        <Probe>
          <span data-testid="own" />
        </Probe>
      </Slot>,
    );

    expect((receivedProps?.children as React.ReactElement).type).toBe("span");
  });

  it("errors when the subtree holds more than one candidate", () => {
    expect(() =>
      render(
        <Slot>
          <Probe />
          <Probe />
        </Slot>,
      ),
    ).toThrow();
  });
});
