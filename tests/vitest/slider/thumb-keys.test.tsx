// @vitest-environment jsdom

// Slider.Thumb keyboard adjustment: arrows along the value axis step, PageUp/PageDown
// step by ten, Home/End jump to the bounds, Return/Space commit without changing,
// and the cross axis is left to the navigation controller.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const controllable = await import("../../../packages/react/runtime/src/useControllableState");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
  const react = await import("react");

  function Slot(props: { children?: React.ReactNode } & Record<string, unknown>) {
    const { children, ...slotProps } = props;
    if (!react.default.isValidElement(children)) {
      return null;
    }
    return react.default.cloneElement(children, {
      ...(children.props as Record<string, unknown>),
      ...slotProps,
    });
  }

  return {
    composeEvents: runtimeProps.composeEvents,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    getSlotChild: runtimeSlot.getSlotChild,
    useControllableState: controllable.useControllableState,
    createStrictContext: strictContext.createStrictContext,
    React: react.default,
    Slot,
  };
});

vi.mock("@lattice-ui/react-focus", () => ({
  useFocusNode: () => ({ current: undefined }),
}));

vi.mock("@lattice-ui/react-motion", () => ({
  createSliderThumbResponseRecipe: () => ({}),
  useResponseMotion: () => ({ current: undefined }),
}));

import { SliderRoot } from "../../../packages/react/slider/src/Slider/SliderRoot";
import { SliderThumb } from "../../../packages/react/slider/src/Slider/SliderThumb";

const KEYS = ["Up", "Down", "Left", "Right", "Home", "End", "PageUp", "PageDown", "Return", "Space"];

beforeEach(() => {
  const keyCode = (Enum as unknown as { KeyCode: Record<string, string> }).KeyCode;
  for (const key of KEYS) {
    keyCode[key] = key;
  }
});

afterEach(() => {
  cleanup();
});

type InputBegan = (rbx: unknown, input: { KeyCode: string; UserInputType: string }) => void;

function renderSlider(rootProps: Record<string, unknown>) {
  let childProps: { Event?: { InputBegan?: InputBegan } } = {};
  const Probe = React.forwardRef<unknown, typeof childProps>((props, _ref) => {
    childProps = props;
    return null;
  });
  Probe.displayName = "Probe";

  render(
    React.createElement(
      SliderRoot as React.ComponentType<Record<string, unknown>>,
      rootProps,
      React.createElement(SliderThumb, { asChild: true }, React.createElement(Probe)),
    ),
  );

  return (key: string) =>
    act(() => childProps.Event?.InputBegan?.(undefined, { KeyCode: key, UserInputType: "Keyboard" }));
}

describe("Slider.Thumb keys", () => {
  it("steps along a horizontal value axis and ignores the cross axis", () => {
    const onValueChange = vi.fn();
    const press = renderSlider({ defaultValue: 50, onValueChange });

    press("Right");
    press("Left");
    press("Left");
    press("Up");
    press("Down");

    expect(onValueChange.mock.calls).toEqual([[51], [50], [49]]);
  });

  it("uses Up/Down on a vertical slider", () => {
    const onValueChange = vi.fn();
    const press = renderSlider({ defaultValue: 50, orientation: "vertical", onValueChange });

    press("Up");
    press("Right");
    press("Down");

    expect(onValueChange.mock.calls).toEqual([[51], [50]]);
  });

  it("pages by ten steps and jumps to the bounds, clamped", () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const press = renderSlider({ defaultValue: 95, step: 1, onValueChange, onValueCommit });

    press("PageUp");
    expect(onValueChange).toHaveBeenLastCalledWith(100);
    press("Home");
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    press("PageDown");
    press("End");
    expect(onValueChange).toHaveBeenLastCalledWith(100);
    expect(onValueCommit.mock.calls).toEqual([[100], [0], [0], [100]]);
  });

  it("keeps fractional steps on the step grid", () => {
    const onValueChange = vi.fn();
    const press = renderSlider({ min: 0, max: 1, step: 0.1, defaultValue: 0.2, onValueChange });

    press("Right");
    press("Right");

    expect(onValueChange.mock.calls).toEqual([[0.3], [0.4]]);
  });

  it("commits the current value on Return and Space without changing it", () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const press = renderSlider({ defaultValue: 30, onValueChange, onValueCommit });

    press("Return");
    press("Space");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit.mock.calls).toEqual([[30], [30]]);
  });

  it("ignores keys while disabled", () => {
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    const press = renderSlider({ defaultValue: 30, disabled: true, onValueChange, onValueCommit });

    press("Right");
    press("Home");
    press("Return");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommit).not.toHaveBeenCalled();
  });
});
