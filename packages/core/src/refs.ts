import type React from "@rbxts/react";

type AnyRef<T> = React.Ref<T> | React.ForwardedRef<T>;

export function setRef<T>(ref: AnyRef<T> | undefined, value: T | undefined) {
  if (typeIs(ref, "function")) {
    (ref as (v: T | undefined) => void)(value);
    return;
  }
  if (typeIs(ref, "table")) {
    (ref as React.MutableRefObject<T | undefined>).current = value;
  }
}

export function composeRefs<T>(...refs: Array<AnyRef<T> | undefined>) {
  return (node: T | undefined) => {
    for (const ref of refs) if (ref) setRef(ref, node);
  };
}
