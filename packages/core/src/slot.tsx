import React from "@rbxts/react";
import { composeRefs } from "./refs";

type AnyProps = Record<string, unknown>;
type Fn = (...args: unknown[]) => void;
type HandlerTable = Partial<Record<string, Fn>>;

function mergeHandlerTable(a?: HandlerTable, b?: HandlerTable) {
  if (!a) return b;
  if (!b) return a;
  const out: HandlerTable = { ...a };
  for (const [key, value] of pairs(b)) {
    const k = key as string;
    const af = a[k];
    const bf = value as Fn | undefined;
    out[k] =
      af && bf
        ? (...args) => {
            bf(...args);
            af(...args);
          }
        : (bf ?? af)!;
  }
  return out;
}

export type SlotProps = {
  children: React.ReactElement;
} & Record<string, unknown>;

export const Slot = React.forwardRef<Instance, SlotProps>((props, forwardedRef) => {
  const child = React.Children.only(props.children) as React.ReactElement;
  const childProps = child.props as AnyProps;

  const mergedProps: AnyProps = { ...props, ...childProps };
  mergedProps.children = childProps.children;

  const slotEvent = props.Event as HandlerTable | undefined;
  const childEvent = childProps.Event as HandlerTable | undefined;
  const slotChange = props.Change as HandlerTable | undefined;
  const childChange = childProps.Change as HandlerTable | undefined;

  const Event = mergeHandlerTable(slotEvent, childEvent);
  const Change = mergeHandlerTable(slotChange, childChange);
  if (Event) mergedProps.Event = Event;
  if (Change) mergedProps.Change = Change;

  const slotRef = props.ref as React.ForwardedRef<Instance> | undefined;
  const childRef = childProps.ref as React.ForwardedRef<Instance> | undefined;
  const mergedRef = composeRefs(childRef, forwardedRef, slotRef);

  return React.cloneElement(child, {
    ...(mergedProps as React.Attributes),
    ref: mergedRef,
  });
});
Slot.displayName = "Slot";
