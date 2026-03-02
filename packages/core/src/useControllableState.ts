import React from "@rbxts/react";

type Props<T> = {
  value?: T;
  defaultValue: T;
  onChange?: (next: T) => void;
};

export function useControllableState<T>({ value, defaultValue, onChange }: Props<T>) {
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const state = (controlled ? value : inner) as T;

  const setState = React.useCallback(
    (nextValue: T | ((prev: T) => T)) => {
      const computed = typeIs(nextValue, "function") ? (nextValue as (p: T) => T)(state) : nextValue;
      if (!controlled) setInner(computed);
      onChange?.(computed);
    },
    [controlled, onChange, state],
  );

  return [state, setState] as const;
}
