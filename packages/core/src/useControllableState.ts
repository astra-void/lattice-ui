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
  const stateRef = React.useRef(state);
  const controlledRef = React.useRef(controlled);
  const onChangeRef = React.useRef(onChange);

  stateRef.current = state;
  controlledRef.current = controlled;
  onChangeRef.current = onChange;

  const setState = React.useCallback((nextValue: T | ((prev: T) => T)) => {
    const current = stateRef.current;
    const computed = isUpdater(nextValue) ? nextValue(current) : nextValue;

    if (computed === current) {
      return;
    }

    stateRef.current = computed;

    if (!controlledRef.current) {
      setInner(computed);
    }

    onChangeRef.current?.(computed);
  }, []);

  return [state, setState] as const;
}
