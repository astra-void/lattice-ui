// @vitest-environment jsdom
// @ts-nocheck

import { render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useResponseMotion } = vi.hoisted(() => ({
  useResponseMotion: vi.fn(() => ({ current: undefined })),
}));

vi.mock("@lattice-ui/core", () => {
  const React = require("react");

  function Slot(props: { children?: React.ReactNode } & Record<string, unknown>) {
    const { children, ...slotProps } = props;
    if (!React.isValidElement(children)) {
      return null;
    }

    return React.cloneElement(children, {
      ...children.props,
      ...slotProps,
    });
  }

  return {
    React,
    Slot,
  };
});

vi.mock("@lattice-ui/motion", () => ({
  useResponseMotion,
}));

import { ToastRoot } from "../../../packages/toast/src/Toast/ToastRoot";

afterEach(() => {
  vi.clearAllMocks();
});

describe("ToastRoot motion regressions", () => {
  it("forwards custom response motion transitions to the motion hook", () => {
    const customTransition = {
      settle: {
        duration: 0.3,
        tempo: "steady",
        tone: "calm",
      },
    };

    render(
      <ToastRoot asChild={true} transition={customTransition} visible={true}>
        <div data-testid="toast" />
      </ToastRoot>,
    );

    expect(useResponseMotion).toHaveBeenCalledTimes(1);
    expect(useResponseMotion).toHaveBeenCalledWith(
      true,
      {
        active: { BackgroundTransparency: 0 },
        inactive: { BackgroundTransparency: 1 },
      },
      customTransition,
    );
  });
});
