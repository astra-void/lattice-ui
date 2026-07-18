// @vitest-environment jsdom

// Unit tests for useActivationGuard, the dedupe behind the gamepad/keyboard
// double-fire fix. A selectable button receives BOTH `Activated` and an
// `InputBegan` (KeyCode.Return/Space) for a single selection activation, so
// toggle handlers wired on both events would flip state twice. The guard lets
// only the first claim win, then clears on the next scheduler resumption.

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// useActivationGuard pulls React from the @lattice-ui/core entry; mock it to the
// real react module so we don't drag in the roblox-only re-export shims.
vi.mock("@lattice-ui/core", async () => {
  const react = await import("react");
  return { React: react.default };
});

import { useActivationGuard } from "../../../packages/focus/src/useActivationGuard";

afterEach(() => {
  cleanup();
});

// The roblox shim maps task.defer onto queueMicrotask, so a macrotask tick
// flushes the deferred reset.
function flushDefer() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("useActivationGuard", () => {
  it("lets only the first claim of one activation win", () => {
    const { result } = renderHook(() => useActivationGuard());
    const claim = result.current;

    // Activated + InputBegan(Return) for the same physical activation.
    expect(claim()).toBe(true);
    expect(claim()).toBe(false);
    expect(claim()).toBe(false);
  });

  it("re-arms for the next activation after the deferred reset", async () => {
    const { result } = renderHook(() => useActivationGuard());

    expect(result.current()).toBe(true);
    expect(result.current()).toBe(false);

    await act(async () => {
      await flushDefer();
    });

    // A distinct activation on a later frame must be handled again.
    expect(result.current()).toBe(true);
    expect(result.current()).toBe(false);
  });

  it("keeps a stable claim identity across renders", () => {
    const { result, rerender } = renderHook(() => useActivationGuard());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
