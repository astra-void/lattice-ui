// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// Import the module directly: the package index re-exports `react.ts`, whose
// `import = require` syntax does not survive the vitest ESM transform.
import { useControllableState } from "../../../packages/react/runtime/src/useControllableState";

describe("useControllableState", () => {
  it("updates state and fires onChange when uncontrolled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<boolean>({ defaultValue: false, onChange }),
    );

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("suppresses redundant onChange for the current value when uncontrolled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<boolean>({ defaultValue: true, onChange }),
    );

    act(() => {
      result.current[1](true);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("chains same-frame updaters against the pending value when uncontrolled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<number>({ defaultValue: 0, onChange }),
    );

    act(() => {
      result.current[1]((prev) => prev + 1);
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenNthCalledWith(1, 1);
    expect(onChange).toHaveBeenNthCalledWith(2, 2);
  });

  it("re-fires onChange on every attempt when a controlled parent rejects the change", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      // Parent never adopts the value: `value` stays false and no re-render
      // happens in response to onChange (the "block close while saving"
      // controlled-rejection pattern).
      useControllableState<boolean>({ value: false, defaultValue: false, onChange }),
    );

    act(() => {
      result.current[1](true);
    });
    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });

  it("passes the rendered controlled value to updaters, not a phantom pending value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<boolean>({ value: false, defaultValue: false, onChange }),
    );

    act(() => {
      result.current[1]((prev) => !prev);
    });
    act(() => {
      result.current[1]((prev) => !prev);
    });

    // The controlled value never changed, so both toggles must be computed
    // from `false` and request `true` — never emit onChange(false).
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });

  it("dedupes after a controlled parent accepts the change", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: boolean }) =>
        useControllableState<boolean>({ value, defaultValue: false, onChange }),
      { initialProps: { value: false } },
    );

    act(() => {
      result.current[1](true);
    });
    rerender({ value: true });
    act(() => {
      result.current[1](true);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
