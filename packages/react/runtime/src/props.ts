import type React from "@rbxts/react";

/**
 * Instance props a consumer passes through a primitive onto the element it renders.
 * Primitives are unstyled, so this is how appearance reaches the underlying instance.
 *
 * `T` is the instance the part actually renders, which keeps the forwarded props checked: an
 * unknown key, a typo, or a prop that was removed from the primitive's API is a compile error
 * rather than something silently absorbed. `Parent` and `Name` are not forwardable — Roblox owns
 * parenting, and `Name` is excluded from `InstanceAttributes` upstream.
 */
export type PassthroughProps<T extends Instance = GuiObject> = React.InstanceProps<T>;

/**
 * Every prop except the ones the primitive owns, ready to spread onto the rendered instance.
 *
 * `ownKeys` must list the primitive's own API (`asChild`, `children`, state props, ...); anything
 * else is treated as an instance prop and forwarded verbatim. Pass the rendered instance as `T` so
 * the result spreads onto that element without widening it.
 */
export function getPassthroughProps<T extends Instance = GuiObject>(
  props: object,
  ownKeys: readonly string[],
): PassthroughProps<T> {
  const rest: Record<string, unknown> = {};

  for (const [key, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(key, "string")) {
      continue;
    }

    if (ownKeys.includes(key)) {
      continue;
    }

    rest[key] = value;
  }

  return rest as PassthroughProps<T>;
}

/**
 * Hands forwarded props to `Slot`, which merges them onto an element the consumer owns.
 *
 * The primitive types its passthrough against the instance it would have rendered itself, but under
 * `asChild` the real target is the consumer's element and its type is unknowable here — so this is
 * the one place that widening is legitimate, rather than a cast scattered across every call site.
 */
export function toSlotProps<T extends Instance>(passthrough: PassthroughProps<T>) {
  return passthrough as unknown as React.Attributes & Record<string, unknown>;
}

type EventMap = Record<string, Callback>;

/**
 * Merge a consumer's `Event` table with the primitive's own handlers.
 *
 * Both run, consumer first, so forwarding an `Activated` handler never silently replaces the
 * behavior the primitive depends on.
 */
export function composeEvents(consumerEvents: unknown, ownEvents: EventMap): EventMap {
  if (!typeIs(consumerEvents, "table")) {
    return ownEvents;
  }

  const merged: EventMap = { ...(consumerEvents as EventMap) };

  for (const [eventName, ownHandler] of pairs(ownEvents)) {
    const consumerHandler = merged[eventName as string];

    if (consumerHandler === undefined) {
      merged[eventName as string] = ownHandler;
      continue;
    }

    merged[eventName as string] = ((...args: unknown[]) => {
      (consumerHandler as Callback)(...args);
      (ownHandler as Callback)(...args);
    }) as Callback;
  }

  return merged;
}
