import React from "@rbxts/react";

type Props<T> = {
  value?: T;
  defaultValue: T;
  onChange?: (next: T) => void;
};

function isUpdater<T>(value: T | ((prev: T) => T)): value is (prev: T) => T {
  return typeIs(value, "function");
}

export function useControllableState<T>({ value, defaultValue, onChange }: Props<T>) {
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const state = value !== undefined ? value : inner;

  const setState = React.useCallback(
    (nextValue: T | ((prev: T) => T)) => {
      const computed = isUpdater(nextValue) ? nextValue(state) : nextValue;
      if (!controlled) setInner(computed);
      onChange?.(computed);
    },
    [controlled, onChange, state],
  );

  return [state, setState] as const;
}
