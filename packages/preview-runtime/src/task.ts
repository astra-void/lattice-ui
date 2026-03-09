import { subscribeToFrames } from "./frameScheduler";
import { reportPreviewRuntimeError } from "./runtimeError";

export type TaskCallback<TArgs extends readonly unknown[] = readonly unknown[]> = (...args: TArgs) => void;
export type TaskHandle = ReturnType<typeof globalThis.setTimeout>;

function normalizeDelay(seconds?: number) {
  if (seconds === undefined || !Number.isFinite(seconds)) {
    return 0;
  }

  return Math.max(0, seconds);
}

export function wait(seconds?: number) {
  const targetSeconds = normalizeDelay(seconds);
  const startedAt = performance.now();

  return new Promise<number>((resolve) => {
    const unsubscribe = subscribeToFrames(({ now }) => {
      const elapsed = Math.max(0, (now - startedAt) / 1000);
      if (elapsed + Number.EPSILON < targetSeconds) {
        return;
      }

      unsubscribe();
      resolve(elapsed);
    });
  });
}

export function delay<TArgs extends readonly unknown[]>(
  seconds: number,
  callback: TaskCallback<TArgs>,
  ...args: TArgs
) {
  const timeoutId = globalThis.setTimeout(
    () => {
      try {
        callback(...args);
      } catch (error) {
        reportPreviewRuntimeError("task.delay", error);
      }
    },
    normalizeDelay(seconds) * 1000,
  );

  return timeoutId;
}

export function spawn<TArgs extends readonly unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
  ...args: TArgs
) {
  try {
    return callback(...args);
  } catch (error) {
    reportPreviewRuntimeError("task.spawn", error);
    return undefined;
  }
}

export function defer<TArgs extends readonly unknown[]>(callback: TaskCallback<TArgs>, ...args: TArgs) {
  queueMicrotask(() => {
    try {
      callback(...args);
    } catch (error) {
      reportPreviewRuntimeError("task.defer", error);
    }
  });
}

export function cancel(handle: unknown) {
  if (handle == null) {
    return;
  }

  if (typeof handle === "object" && handle !== null && "cancel" in handle) {
    const cancel = (handle as { cancel?: () => void }).cancel;
    if (typeof cancel === "function") {
      cancel();
      return;
    }
  }

  globalThis.clearTimeout(handle as TaskHandle);
}

export interface TaskLibrary {
  readonly cancel: typeof cancel;
  readonly wait: typeof wait;
  readonly delay: typeof delay;
  readonly spawn: typeof spawn;
  readonly defer: typeof defer;
}

export const task: TaskLibrary = {
  cancel,
  wait,
  delay,
  spawn,
  defer,
};

export default task;
