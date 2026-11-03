import React from "@rbxts/react";
import { composeRefs, getElementRef } from "./refs";

type Fn = (...args: unknown[]) => void;
type HandlerTable = Partial<Record<string, Fn>>;
type SlotRef = React.ForwardedRef<Instance>;
type SlotPropBag = React.Attributes & Record<string, unknown>;
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
    out[rawKey] = af
      ? (...args) => {
          bf(...args);
          af(...args);
        }
      : bf;
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

    // @rbxts/react normalizes host-element Event/Change tables into tag-keyed
    // props at createElement time, so a JSX host child's own handlers arrive
    // here at `reactKey` (copied in by the childProps spread) rather than in
    // childProps.Event/Change. Compose instead of overwriting: child handler
    // first, then the slot's, matching mergeHandlerTable order.
    const existing = dynamicProps[reactKey];
    if (isFn(existing) && existing !== candidate) {
      const childHandler = existing;
      const slotHandler = candidate;
      dynamicProps[reactKey] = (...args: unknown[]) => {
        childHandler(...args);
        slotHandler(...args);
      };
    } else {
      dynamicProps[reactKey] = candidate;
    }
  }

  props[key] = undefined;
}

/**
 * Prepares props for `React.cloneElement` onto a host element. `@rbxts/react` turns `Event` and
 * `Change` tables into React-keyed props only inside `createElement`; `cloneElement` passes them
 * through untouched, so a consumer's `Event={{ MouseEnter }}` would never connect. Handlers the
 * child already carries are composed, child first — the same rule `Slot` applies.
 */
export function toCloneElementProps<T extends Record<string, unknown>>(props: T): T {
  const out = { ...props } as unknown as SlotPropBag;
  moveHandlersToReactKeyedProps(out, "Event");
  moveHandlersToReactKeyedProps(out, "Change");
  return out as unknown as T;
}

// Roblox attaches UI modifiers as children rather than as properties, so an `asChild` subtree can
// legitimately hold more than one element: the consumer's GuiObject plus any number of these. A
// Tailwind-style transform emits exactly that shape — `rounded-md` on an `asChild` part becomes a
// `uicorner` sibling of the element the consumer wrote. Treating those as the slot target would
// clone the modifier instead of the element, so they are routed into the target's own children.
// Both spellings of every modifier are listed because the two runtimes these primitives render
// under disagree about which one an element carries, and neither of them is wrong:
//   - `@rbxts/react`'s `createElement` rewrites a host tag to its Roblox class name before it
//     builds the element (`tags[component]`, a lowercased-class-name lookup), so in Roblox the
//     `<uicorner />` a transform emitted reaches here as `"UICorner"`.
//   - loom's preview renderer re-exports browser React's `createElement` untouched and resolves
//     the class name only when it creates the host instance, so the very same element reaches
//     here as `"uicorner"`.
// Keying one spelling alone therefore left the other runtime's modifiers reading as a second slot
// target: keyed by tag, `asChild` failed on every styled subtree in Roblox; keyed by class name, it
// failed the same way in the loom previews. Lower-casing the type instead of listing both is not
// portable — this module compiles for Luau, where the method is `lower()`, and runs in the browser,
// where it is `toLowerCase()`.
// This is the complete set of creatable `UIComponent` classes (`@rbxts/types` CreatableInstances);
// anything else counts as a candidate target.
const UI_MODIFIER_TYPES: Record<string, boolean> = {
  uiaspectratioconstraint: true,
  UIAspectRatioConstraint: true,
  uicorner: true,
  UICorner: true,
  uidragdetector: true,
  UIDragDetector: true,
  uiflexitem: true,
  UIFlexItem: true,
  uigradient: true,
  UIGradient: true,
  uigridlayout: true,
  UIGridLayout: true,
  uilistlayout: true,
  UIListLayout: true,
  uipadding: true,
  UIPadding: true,
  uipagelayout: true,
  UIPageLayout: true,
  uiscale: true,
  UIScale: true,
  // `shadow-*` lowers to one of these, so leaving it out failed `asChild` exactly like a casing miss.
  uishadow: true,
  UIShadow: true,
  uisizeconstraint: true,
  UISizeConstraint: true,
  uistroke: true,
  UIStroke: true,
  uitablelayout: true,
  UITableLayout: true,
  uitextsizeconstraint: true,
  UITextSizeConstraint: true,
};

function isUiModifierElement(node: React.ReactElement) {
  const elementType = (node as { type?: unknown }).type;

  return typeIs(elementType, "string") && UI_MODIFIER_TYPES[elementType] === true;
}

export type SlotChildren = {
  /** The element to clone, or `undefined` when the subtree does not hold exactly one candidate. */
  target: React.ReactElement<SlotPropBag> | undefined;
  /** UI modifiers to re-attach under `target` so their styling is not dropped. */
  modifiers: React.ReactElement[];
};

/**
 * Split an `asChild` subtree into the element a primitive should clone and the UI modifiers that
 * belong under it. Primitives call this instead of `React.isValidElement` so a modifier sibling
 * does not read as "not a single child".
 */
export function resolveSlotChildren(children: React.ReactNode): SlotChildren {
  if (React.isValidElement(children)) {
    // A fragment is a grouping node, not something a primitive can clone props onto, so look
    // through it. Anything a transform or a `.map()` wrapped in one still resolves.
    if (children.type === React.Fragment) {
      const fragmentProps = children.props as { children?: React.ReactNode };

      return resolveSlotChildren(fragmentProps.children);
    }

    // A lone modifier is not something to clone onto: `asChild` with a `className` but no child
    // produces exactly that, and treating it as the target would put the primitive's behavior
    // props on a UICorner. Report no target so the caller raises its own `asChild` error.
    if (isUiModifierElement(children)) {
      return { target: undefined, modifiers: [children] };
    }

    // Fast path for the common single-element case: no re-keying, no allocation.
    return { target: children as React.ReactElement<SlotPropBag>, modifiers: [] };
  }

  const modifiers: React.ReactElement[] = [];
  let target: React.ReactElement<SlotPropBag> | undefined;
  let targetCount = 0;

  for (const node of React.Children.toArray(children)) {
    if (!React.isValidElement(node)) {
      continue;
    }

    if (isUiModifierElement(node)) {
      modifiers.push(node);
      continue;
    }

    if (node.type === React.Fragment) {
      const nested = resolveSlotChildren((node.props as { children?: React.ReactNode }).children);
      for (const modifier of nested.modifiers) {
        modifiers.push(modifier);
      }

      if (nested.target !== undefined) {
        targetCount += 1;
        if (target === undefined) {
          target = nested.target;
        }
      }

      continue;
    }

    targetCount += 1;
    if (target === undefined) {
      target = node as React.ReactElement<SlotPropBag>;
    }
  }

  // More than one candidate stays an error: which element the primitive's props belong on would
  // be a guess, and silently picking one is worse than telling the consumer to wrap them.
  return { target: targetCount === 1 ? target : undefined, modifiers };
}

/** The element an `asChild` primitive should clone, or `undefined` if the subtree is not valid. */
export function getSlotChild(children: React.ReactNode) {
  return resolveSlotChildren(children).target;
}

/**
 * Children for a cloned `asChild` element: the modifiers that were written as its siblings, then
 * whatever it already had. Primitives that clone directly instead of going through `Slot` use this
 * so the modifiers still land somewhere.
 */
export function mergeSlotModifiers(modifiers: React.ReactElement[], children: React.ReactNode): React.ReactNode {
  if (modifiers[0] === undefined) {
    return children;
  }

  // `toArray` keys the element's own children too; an array holding unkeyed elements warns. It also
  // keyed the modifiers when `resolveSlotChildren` walked the subtree, and both walks start their
  // numbering at `.0` — so merging the two lists as they are collides the first modifier with the
  // element's first child, and React is explicit that a duplicate key may duplicate or omit a
  // child rather than merely warn. Re-key the modifiers into a namespace of their own; the index
  // keeps each one stable across renders, which their position in the subtree already is.
  const keyed = modifiers.map((modifier, index) =>
    React.cloneElement(modifier, { key: `lattice-slot-modifier-${index}` }),
  );

  return [...keyed, ...React.Children.toArray(children)];
}

export type SlotProps = {
  children: React.ReactNode;
  ref?: SlotRef;
} & SlotPropBag;

export const Slot = React.forwardRef<Instance, SlotProps>((props, forwardedRef) => {
  const { target, modifiers } = resolveSlotChildren(props.children);
  if (!target) {
    error("[Slot] expected exactly one child element besides any UI modifiers.");
  }

  const child = target;
  const childProps = toSlotPropBag((child as { props?: unknown }).props);

  // Slot props override child props: primitives pass state-driven props
  // (Visible, Active, Selectable) that must win over the child's static
  // values. Primitives must not pass cosmetic defaults through Slot.
  const mergedProps: SlotPropBag = { ...childProps, ...props };
  // Modifiers were written as siblings of the child but describe it, so they render underneath it.
  mergedProps.children = mergeSlotModifiers(modifiers, childProps.children);

  const slotEvent = toHandlerTable(props.Event);
  const childEvent = toHandlerTable(childProps.Event);
  const slotChange = toHandlerTable(props.Change);
  const childChange = toHandlerTable(childProps.Change);

  const Event = mergeHandlerTable(slotEvent, childEvent);
  const Change = mergeHandlerTable(slotChange, childChange);
  if (Event) mergedProps.Event = Event;
  if (Change) mergedProps.Change = Change;

  // A `ref` written on `Slot` arrives as `forwardedRef` — React strips it out of
  // `props` for every forwardRef component, so `props.ref` only ever held the
  // development warning accessor.
  const childRef = getElementRef<Instance>(child);
  // Memoize: a fresh callback-ref identity per render would make react-lua
  // detach and reattach every composed ref on each parent re-render.
  const mergedRef = React.useMemo(() => composeRefs(childRef, forwardedRef), [childRef, forwardedRef]);
  mergedProps.ref = mergedRef;

  // cloneElement bypasses @rbxts/react createElement Event/Change normalization.
  moveHandlersToReactKeyedProps(mergedProps, "Event");
  moveHandlersToReactKeyedProps(mergedProps, "Change");

  return React.cloneElement(child, mergedProps);
});
Slot.displayName = "Slot";
