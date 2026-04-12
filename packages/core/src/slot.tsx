import React from "@rbxts/react";
import { composeRefs } from "./refs";

type Fn = (...args: unknown[]) => void;
type HandlerTable = Partial<Record<string, Fn>>;
type SlotRef = React.ForwardedRef<Instance>;
type SlotPropBag = React.Attributes & Record<string, unknown>;
type InstanceRefCallback = (instance: Instance | undefined) => void;
type ReactRuntimeWithEvents = {
  Event: Record<string, string>;
  Change: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeIs(value, "table");
}

function toSlotPropBag(value: unknown): SlotPropBag {
  return isRecord(value) ? (value as SlotPropBag) : {};
}

function isFn(value: unknown): value is Fn {
  return typeIs(value, "function");
}

function toHandlerTable(value: unknown): HandlerTable | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const out: HandlerTable = {};
  for (const [rawKey, candidate] of pairs(value)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    if (isFn(candidate)) {
      out[rawKey] = candidate;
    }
  }

  return next(out)[0] !== undefined ? out : undefined;
}

function toForwardedRef(value: unknown): SlotRef | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (isInstanceRefCallback(value)) {
    return value;
  }

  if (isInstanceMutableRefObject(value)) {
    return value;
  }

  return undefined;
}

function isInstanceRefCallback(value: unknown): value is InstanceRefCallback {
  return typeIs(value, "function");
}

function isInstanceMutableRefObject(value: unknown): value is React.MutableRefObject<Instance | undefined> {
  return typeIs(value, "table") && "current" in value;
}

function mergeHandlerTable(a?: HandlerTable, b?: HandlerTable) {
  if (!a) return b;
  if (!b) return a;
  const out: HandlerTable = { ...a };
  for (const [rawKey, candidate] of pairs(b)) {
    if (!typeIs(rawKey, "string") || !isFn(candidate)) {
      continue;
    }

    const af = a[rawKey];
    const bf = candidate;
    out[rawKey] =
      af && bf
        ? (...args) => {
            bf(...args);
            af(...args);
          }
        : (bf ?? af)!;
  }
  return out;
}

function moveHandlersToReactKeyedProps(props: SlotPropBag, key: "Event" | "Change") {
  const handlers = toHandlerTable(props[key]);
  if (!handlers) {
    props[key] = undefined;
    return;
  }

  const reactRuntime = React as unknown as ReactRuntimeWithEvents;
  const source = key === "Event" ? reactRuntime.Event : reactRuntime.Change;
  const dynamicProps = props as unknown as Record<string, unknown>;

  for (const [rawKey, candidate] of pairs(handlers)) {
    if (!typeIs(rawKey, "string") || !isFn(candidate)) {
      continue;
    }

    const reactKey = source[rawKey];
    if (reactKey === undefined) {
      continue;
    }

    dynamicProps[reactKey] = candidate;
  }

  props[key] = undefined;
}

export type SlotProps = {
  children: React.ReactElement<SlotPropBag>;
  ref?: SlotRef;
} & SlotPropBag;

export const Slot = React.forwardRef<Instance, SlotProps>((props, forwardedRef) => {
  const child = props.children;
  const childProps = toSlotPropBag((child as { props?: unknown }).props);

  const mergedProps: SlotPropBag = { ...childProps, ...props };
  mergedProps.children = childProps.children;

  const slotEvent = toHandlerTable(props.Event);
  const childEvent = toHandlerTable(childProps.Event);
  const slotChange = toHandlerTable(props.Change);
  const childChange = toHandlerTable(childProps.Change);

  const Event = mergeHandlerTable(slotEvent, childEvent);
  const Change = mergeHandlerTable(slotChange, childChange);
  if (Event) mergedProps.Event = Event;
  if (Change) mergedProps.Change = Change;

  const slotRef = toForwardedRef(props.ref);
  const childRef = toForwardedRef(childProps.ref);
  const mergedRef = composeRefs(childRef, forwardedRef, slotRef);
  mergedProps.ref = mergedRef;

  // cloneElement bypasses @rbxts/react createElement Event/Change normalization.
  moveHandlersToReactKeyedProps(mergedProps, "Event");
  moveHandlersToReactKeyedProps(mergedProps, "Change");

  return React.cloneElement(child, mergedProps);
});
Slot.displayName = "Slot";
