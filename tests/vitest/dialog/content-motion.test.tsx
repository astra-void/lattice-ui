// @vitest-environment jsdom
// @ts-nocheck

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runService } = vi.hoisted(() => {
  const listeners = new Set<(dt: number) => void>();
  const workspace = {};

  const runService = {
    RenderStepped: {
      Connect(listener: (dt: number) => void) {
        listeners.add(listener);
        return {
          Disconnect() {
            listeners.delete(listener);
          },
        };
      },
    },
    IsStudio() {
      return false;
    },
    step(dt: number) {
      for (const listener of [...listeners]) {
        listener(dt);
      }
    },
    reset() {
      listeners.clear();
    },
  };

  (globalThis as Record<string, unknown>).game = {
    GetService: vi.fn((serviceName: string) => {
      if (serviceName === "RunService") {
        return runService;
      }
      if (serviceName === "Workspace") {
        return workspace;
      }
      return {};
    }),
  } as unknown as DataModel;

  return { runService };
});

vi.mock("@lattice-ui/core", () => {
  const React = require("react");

  function Slot(props: { children?: React.ReactNode; ref?: React.Ref<unknown> } & Record<string, unknown>) {
    const { children, ...slotProps } = props;
    if (!React.isValidElement(children)) {
      return null;
    }

    return React.cloneElement(children, {
      ...children.props,
      ...slotProps,
    });
  }

  function useControllableState<T>(options: { value?: T; defaultValue?: T; onChange?: (value: T) => void }) {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(options.defaultValue);
    const value = options.value !== undefined ? options.value : uncontrolledValue;

    const setValue = React.useCallback(
      (nextValue: T) => {
        if (options.value === undefined) {
          setUncontrolledValue(nextValue);
        }

        options.onChange?.(nextValue);
      },
      [options.onChange, options.value],
    );

    return [value, setValue] as const;
  }

  function createStrictContext<T>(_name: string) {
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
  }

  return {
    React,
    Slot,
    useControllableState,
    createStrictContext,
  };
});

vi.mock("@lattice-ui/focus", () => ({
  FocusScope: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@lattice-ui/layer", () => {
  const React = require("react");

  function Presence(props: {
    present: boolean;
    render: (state: { isPresent: boolean; onExitComplete: () => void }) => React.ReactElement | null;
  }) {
    const [mounted, setMounted] = React.useState(props.present);
    const [isPresent, setIsPresent] = React.useState(props.present);

    React.useEffect(() => {
      if (props.present) {
        setMounted(true);
        setIsPresent(true);
        return;
      }

      if (mounted) {
        setIsPresent(false);
      }
    }, [mounted, props.present]);

    if (!mounted) {
      return null;
    }

    return props.render({
      isPresent,
      onExitComplete: () => setMounted(false),
    });
  }

  return {
    DismissableLayer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    Presence,
  };
});

import { Dialog } from "@lattice-ui/dialog";
import type { PresenceMotionConfig } from "@lattice-ui/motion";

beforeEach(() => {
  runService.reset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Dialog.Content motion regressions", () => {
  it("applies the provided presence transition to the dialog-owned motion host and waits for exit completion before unmounting", async () => {
    const customTransition: PresenceMotionConfig = {
      initial: {
        GroupTransparency: 1,
        Position: UDim2.fromOffset(0, 10),
      },
      reveal: {
        values: {
          GroupTransparency: 0.4,
          Position: UDim2.fromOffset(0, 0),
        },
        intent: {
          duration: 0.2,
          tempo: "steady",
          tone: "calm",
        },
      },
      exit: {
        values: {
          GroupTransparency: 0.85,
          Position: UDim2.fromOffset(0, 12),
        },
        intent: {
          duration: 0.16,
          tempo: "swift",
          tone: "calm",
        },
      },
    };

    const { getByTestId, queryByTestId, rerender } = render(
      <Dialog.Root open={true}>
        <Dialog.Content transition={customTransition}>
          <div data-testid="content" />
        </Dialog.Content>
      </Dialog.Root>,
    );

    const content = getByTestId("content");
    const motionHost = content.parentElement as HTMLElement & Record<string, unknown>;
    expect(motionHost.tagName.toLowerCase()).toBe("canvasgroup");
    expect(motionHost.GroupTransparency).toBe(1);

    act(() => {
      runService.step(1);
    });

    expect(motionHost.GroupTransparency).toBe(0.4);

    rerender(
      <Dialog.Root open={false}>
        <Dialog.Content transition={customTransition}>
          <div data-testid="content" />
        </Dialog.Content>
      </Dialog.Root>,
    );

    expect(queryByTestId("content")).not.toBeNull();

    await act(async () => {
      runService.step(1);
      await Promise.resolve();
    });

    expect(motionHost.GroupTransparency).toBe(0.85);
    expect(queryByTestId("content")).toBeNull();
  });

  it("preserves forceMount when closed", () => {
    const { getByTestId } = render(
      <Dialog.Root open={false}>
        <Dialog.Content forceMount={true}>
          <div data-testid="content" />
        </Dialog.Content>
      </Dialog.Root>,
    );

    expect(getByTestId("content")).not.toBeNull();
  });
});
