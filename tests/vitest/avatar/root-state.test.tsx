// @vitest-environment jsdom

// Regression tests: AvatarRoot's status is reset by a parent effect that runs
// AFTER the child AvatarImage effects. It must reset to "loading" ONLY when the
// source actually changes — never on a delayMs change — otherwise it clobbers a
// "loaded"/"error" status the image just reported. Because ImageLabel.IsLoaded
// stays true, no change signal fires again, so the clobber is unrecoverable and
// the avatar goes permanently blank.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/react-runtime", async () => {
  const react = await import("react");
  const strictContext = await import("../../../packages/react/runtime/src/context");

  return {
    React: react.default,
    createStrictContext: strictContext.createStrictContext,
  };
});

import { AvatarRoot } from "../../../packages/react/avatar/src/Avatar/AvatarRoot";
import { useAvatarContext } from "../../../packages/react/avatar/src/Avatar/context";
import type { AvatarContextValue } from "../../../packages/react/avatar/src/Avatar/types";

afterEach(() => {
  cleanup();
});

function renderAvatar(initialProps: Record<string, unknown>) {
  let context: AvatarContextValue | undefined;

  // Stable across rerenders so React keeps the same instance (and the context
  // closure stays wired to the latest render).
  function Probe() {
    context = useAvatarContext();
    return null;
  }

  const element = (props: Record<string, unknown>) =>
    React.createElement(AvatarRoot, props as never, React.createElement(Probe));

  const view = render(element(initialProps));

  return {
    getContext: () => context!,
    rerender: (props: Record<string, unknown>) => {
      act(() => {
        view.rerender(element(props));
      });
    },
  };
}

describe("AvatarRoot status retention", () => {
  it("starts in loading with a source", () => {
    const { getContext } = renderAvatar({ src: "rbxassetid://1" });

    expect(getContext().status).toBe("loading");
  });

  it("starts in error without a source", () => {
    const { getContext } = renderAvatar({ src: "" });

    expect(getContext().status).toBe("error");
    expect(getContext().delayElapsed).toBe(true);
  });

  it("keeps a child-reported loaded status when delayMs changes", () => {
    const { getContext, rerender } = renderAvatar({ src: "rbxassetid://1", delayMs: 250 });

    // The image reports it finished loading.
    act(() => {
      getContext().setStatus("loaded");
    });
    expect(getContext().status).toBe("loaded");

    // Changing only delayMs must NOT reset the status back to "loading".
    rerender({ src: "rbxassetid://1", delayMs: 500 });

    expect(getContext().status).toBe("loaded");
  });

  it("keeps a child-reported error status when delayMs changes", () => {
    const { getContext, rerender } = renderAvatar({ src: "rbxassetid://1", delayMs: 250 });

    act(() => {
      getContext().setStatus("error");
    });
    expect(getContext().status).toBe("error");

    rerender({ src: "rbxassetid://1", delayMs: 900 });

    expect(getContext().status).toBe("error");
  });

  it("resets to loading when the source actually changes", () => {
    const { getContext, rerender } = renderAvatar({ src: "rbxassetid://1" });

    act(() => {
      getContext().setStatus("loaded");
    });
    expect(getContext().status).toBe("loaded");

    rerender({ src: "rbxassetid://2" });

    expect(getContext().status).toBe("loading");
  });

  it("resets to error when the source is cleared", () => {
    const { getContext, rerender } = renderAvatar({ src: "rbxassetid://1" });

    act(() => {
      getContext().setStatus("loaded");
    });
    expect(getContext().status).toBe("loaded");

    rerender({ src: "" });

    expect(getContext().status).toBe("error");
    expect(getContext().delayElapsed).toBe(true);
  });
});
