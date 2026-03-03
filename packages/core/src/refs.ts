import type React from "@rbxts/react";

type AnyRef<T> = React.Ref<T> | React.ForwardedRef<T>;
type RefCallback<T> = (value: T | undefined) => void;

function isRefCallback<T>(ref: AnyRef<T> | undefined): ref is RefCallback<T> {
  return typeIs(ref, "function");
}

function isMutableRefObject<T>(ref: AnyRef<T> | undefined): ref is React.MutableRefObject<T | undefined> {
  return typeIs(ref, "table") && "current" in ref;
}

export function setRef<T>(ref: AnyRef<T> | undefined, value: T | undefined) {
  if (isRefCallback(ref)) {
    ref(value);
    return;
  }
  if (isMutableRefObject(ref)) {
    ref.current = value;
  }
}

export function composeRefs<T>(...refs: Array<AnyRef<T> | undefined>) {
  return (node: T | undefined) => {
    for (const ref of refs) if (ref) setRef(ref, node);
  };
}
