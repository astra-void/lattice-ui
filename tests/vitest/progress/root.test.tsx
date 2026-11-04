// @vitest-environment jsdom
// @ts-nocheck

// Progress.Root is display-only: `value` drives it, `defaultValue` seeds it, and the rendered
// fill always matches the ratio it publishes through `useProgressContext`.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { fillWidths } = vi.hoisted(() => ({ fillWidths: [] as number[] }));

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const react = await import("react");

  return {
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    getSlotChild: runtimeSlot.getSlotChild,
    createStrictContext: strictContext.createStrictContext,
    React: react.default,
    Slot: () => null,
  };
});

vi.mock("@lattice-ui/react-motion", () => ({
  createProgressResponseRecipe: () => ({}),
  useResponseMotion: (_active: boolean, properties: { active: { Size: UDim2 } }) => {
    fillWidths.push(properties.active.Size.X.Scale);
    return { current: undefined };
  },
}));

import { Progress, useProgressContext } from "../../../packages/react/progress/src";

function ContextProbe(props: { onContext: (value: ReturnType<typeof useProgressContext>) => void }) {
  props.onContext(useProgressContext());
  return null;
}

function renderProgress(rootProps: Record<string, unknown>) {
  let context: ReturnType<typeof useProgressContext> | undefined;
  const element = (props: Record<string, unknown>) => (
    <Progress.Root {...props}>
      <ContextProbe onContext={(value) => (context = value)} />
      <Progress.Indicator asChild>
        <frame />
      </Progress.Indicator>
    </Progress.Root>
  );
  const view = render(element(rootProps));
  return {
    context: () => context,
    rerender: (props: Record<string, unknown>) => view.rerender(element(props)),
  };
}

afterEach(() => {
  cleanup();
  fillWidths.splice(0);
});

describe("Progress.Root", () => {
  it("renders the indeterminate fill at the ratio the context reports", () => {
    const view = renderProgress({ indeterminate: true, value: 80 });

    expect(view.context()?.ratio).toBe(0.25);
    expect(fillWidths.at(-1)).toBe(view.context()?.ratio);
  });

  it("keeps a fractional max", () => {
    const view = renderProgress({ max: 0.5, value: 0.25 });

    expect(view.context()?.max).toBe(0.5);
    expect(view.context()?.ratio).toBe(0.5);
    expect(fillWidths.at(-1)).toBe(0.5);
  });

  it("falls back to a max of 100 when max is not positive", () => {
    const view = renderProgress({ max: 0, value: 25 });

    expect(view.context()?.max).toBe(100);
    expect(fillWidths.at(-1)).toBe(0.25);
  });

  it("follows a controlled value", () => {
    const view = renderProgress({ value: 10 });
    expect(view.context()?.value).toBe(10);

    view.rerender({ value: 60 });
    expect(view.context()?.value).toBe(60);
    expect(fillWidths.at(-1)).toBe(0.6);
  });

  it("uses defaultValue when uncontrolled and reads it only on mount", () => {
    const view = renderProgress({ defaultValue: 40 });
    expect(view.context()?.value).toBe(40);

    view.rerender({ defaultValue: 70 });
    expect(view.context()?.value).toBe(40);
  });
});
