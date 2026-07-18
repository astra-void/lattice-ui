import type React from "@rbxts/react";

export type AnyRef<T> = React.Ref<T> | React.ForwardedRef<T>;
type RefCallback<T> = (value: T | undefined) => void;
type MutableRefObject<T> = { current: T | undefined };

function isRefCallback<T>(ref: unknown): ref is RefCallback<T> {
  return typeIs(ref, "function");
}

function isMutableRefObject<T>(ref: unknown): ref is MutableRefObject<T> {
  if (!typeIs(ref, "table")) {
    return false;
  }

  // In __DEV__ react-lua builds, reading `element.props.ref` returns a shared
  // warning sentinel table ({ isReactWarning = true }) instead of the real ref.
  // Treating it as a ref would both drop the child's actual ref and mutate a
  // table shared across every slotted element.
  if ((ref as { isReactWarning?: boolean }).isReactWarning === true) {
    return false;
  }

  // In Luau, refs created from useRef() may start with current=nil, which means
  // the key is not present in the table yet. Accept any other table ref object.
  return true;
}

export function toRef<T>(value: unknown): AnyRef<T> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (isRefCallback<T>(value)) {
    return value;
  }

  if (isMutableRefObject<T>(value)) {
    return value;
  }

  return undefined;
}

export function getElementRef<T>(child: React.ReactElement): AnyRef<T> | undefined {
  const rawProps = (child as { props?: unknown }).props;
  const propsRef = typeIs(rawProps, "table") ? (rawProps as { ref?: unknown }).ref : undefined;

  return toRef<T>(propsRef) ?? toRef<T>((child as { ref?: unknown }).ref);
}

export function setRef<T>(ref: AnyRef<T> | undefined, value: T | undefined) {
  if (isRefCallback(ref)) {
    ref(value);
    return;
  }
  if (isMutableRefObject(ref)) {
    (ref as MutableRefObject<T>).current = value;
  }
}

export function composeRefs<T>(...refs: Array<AnyRef<T> | undefined>) {
  return (node: T | undefined) => {
    for (const ref of refs) if (ref) setRef(ref, node);
  };
}
