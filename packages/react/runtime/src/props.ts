import type React from "@rbxts/react";

/**
 * Instance props a consumer passes through a primitive onto the element it renders.
 * Primitives are unstyled, so this is how appearance reaches the underlying instance.
 */
export type PassthroughProps = React.Attributes & Record<string, unknown>;

/**
 * Every prop except the ones the primitive owns, ready to spread onto the rendered instance.
 *
 * `ownKeys` must list the primitive's own API (`asChild`, `children`, state props, ...); anything
 * else is treated as an instance prop and forwarded verbatim.
 */
export function getPassthroughProps(props: object, ownKeys: readonly string[]): PassthroughProps {
  const rest: PassthroughProps = {};

  for (const [key, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(key, "string")) {
      continue;
    }

    if (ownKeys.includes(key)) {
      continue;
    }

    rest[key] = value;
  }

  return rest;
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
