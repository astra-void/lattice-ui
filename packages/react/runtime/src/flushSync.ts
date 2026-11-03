import ReactRoblox from "./reactRoblox";

type FlushSync = (callback: () => void) => void;

/**
 * Runs `callback` and commits the React updates it schedules before returning. `@rbxts/react-roblox`
 * ships `flushSync` at runtime but leaves it out of its typings; without it the call still runs,
 * only unflushed.
 *
 * Roblox property-change events are not dispatched by React, so an update made from one commits on
 * a later scheduler tick. Controlled text inputs flush so they can compare the TextBox with the
 * committed value right away and restore it when the consumer rejected the edit.
 */
export function flushSync(callback: () => void) {
  const flush = (ReactRoblox as unknown as { flushSync?: FlushSync }).flushSync;
  if (flush !== undefined) {
    flush(callback);
    return;
  }

  callback();
}
