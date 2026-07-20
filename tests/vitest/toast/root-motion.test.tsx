// @vitest-environment jsdom
// @ts-nocheck

import { render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { usePresenceMotionController, createToastRevealRecipe, defaultRecipe, slotPropsLog } = vi.hoisted(() => {
  const defaultRecipe = { initial: { GroupTransparency: 1 } };

  return {
    usePresenceMotionController: vi.fn(),
    createToastRevealRecipe: vi.fn(() => defaultRecipe),
    defaultRecipe,
    slotPropsLog: [] as Array<Record<string, unknown>>,
  };
});

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const React = require("react");

  function Slot(props: { children?: React.ReactNode } & Record<string, unknown>) {
    const { children, ...slotProps } = props;
    slotPropsLog.push(slotProps);
    if (!React.isValidElement(children)) {
      return null;
    }

    return React.cloneElement(children, {
      ...children.props,
    });
  }

  return {
    composeEvents: runtimeProps.composeEvents,
    getSlotChild: runtimeSlot.getSlotChild,
    mergeSlotModifiers: runtimeSlot.mergeSlotModifiers,
    resolveSlotChildren: runtimeSlot.resolveSlotChildren,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    React,
    Slot,
  };
});

vi.mock("@lattice-ui/react-motion", () => ({
  usePresenceMotionController,
  createToastRevealRecipe,
}));

import { ToastRoot } from "../../../packages/react/toast/src/Toast/ToastRoot";

function controller(overrides = {}) {
  return {
    ref: { current: undefined },
    phase: "visible",
    mounted: true,
    ready: true,
    present: true,
    isExiting: false,
    isVisible: true,
    markReady: () => {},
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
  slotPropsLog.splice(0, slotPropsLog.length);
});

describe("ToastRoot motion regressions", () => {
  it("forwards custom presence transitions and exit callbacks to the controller", () => {
    usePresenceMotionController.mockReturnValue(controller());
    const customTransition = {
      initial: { GroupTransparency: 1 },
      reveal: { values: { GroupTransparency: 0 }, intent: { duration: 0.3 } },
      exit: { values: { GroupTransparency: 1 }, intent: { duration: 0.3 } },
    };
    const onExitComplete = vi.fn();

    render(
      <ToastRoot asChild={true} onExitComplete={onExitComplete} transition={customTransition} visible={true}>
        <div data-testid="toast" />
      </ToastRoot>,
    );

    expect(usePresenceMotionController).toHaveBeenCalledTimes(1);
    expect(usePresenceMotionController).toHaveBeenCalledWith({
      present: true,
      config: customTransition,
      onExitComplete,
    });
  });

  // Unstyled primitives ship no default animation: the toast reveal recipe animated hardcoded
  // offsets/transparency, so it is the consumer's to supply via `transition`.
  it("uses no motion when no transition is given", () => {
    usePresenceMotionController.mockReturnValue(controller());

    render(
      <ToastRoot asChild={true} visible={true}>
        <div />
      </ToastRoot>,
    );

    expect(createToastRevealRecipe).not.toHaveBeenCalled();
    expect(usePresenceMotionController).toHaveBeenCalledWith(expect.objectContaining({ config: {} }));
  });

  it("keeps the root visible while the exit animation is running", () => {
    usePresenceMotionController.mockReturnValue(controller({ phase: "exiting", present: false }));

    render(
      <ToastRoot asChild={true} visible={false}>
        <div />
      </ToastRoot>,
    );

    expect(slotPropsLog[0]?.Visible).toBe(true);
  });

  it("hides the root only after the exit completes", () => {
    usePresenceMotionController.mockReturnValue(controller({ phase: "exited", mounted: false, present: false }));

    render(
      <ToastRoot asChild={true} visible={false}>
        <div />
      </ToastRoot>,
    );

    expect(slotPropsLog[0]?.Visible).toBe(false);
  });
});
