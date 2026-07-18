export type ToastRecord = {
  id: string;
  title?: string;
  description?: string;
  durationMs?: number;
  createdAtMs: number;
  visibleAtMs?: number;
  exiting?: boolean;
  exitStartedAtMs?: number;
};

// Exiting toasts are normally removed by the exit animation's completion
// callback (finalizeToast); this timeout is only a fallback for animations
// that never report completion.
export const TOAST_EXIT_TIMEOUT_MS = 1000;

export function enqueueToast(queue: Array<ToastRecord>, toast: ToastRecord) {
  return [...queue, toast];
}

export function dequeueToast(queue: Array<ToastRecord>) {
  if (queue.size() === 0) {
    return queue;
  }

  const nextQueue: Array<ToastRecord> = [];
  for (let index = 1; index < queue.size(); index++) {
    const item = queue[index];
    if (item) {
      nextQueue.push(item);
    }
  }

  return nextQueue;
}

export function getVisibleToasts(queue: Array<ToastRecord>, maxVisible: number) {
  const limit = math.max(1, maxVisible);
  const visible: Array<ToastRecord> = [];
  for (let index = 0; index < queue.size() && index < limit; index++) {
    const item = queue[index];
    if (item) {
      visible.push(item);
    }
  }

  return visible;
}

export function clearToasts(queue: Array<ToastRecord>, nowMs: number, maxVisible: number) {
  const visibleCount = math.max(1, maxVisible);
  let changed = false;

  const nextQueue: Array<ToastRecord> = [];
  for (let index = 0; index < queue.size(); index++) {
    const toast = queue[index];
    if (!toast) {
      continue;
    }

    if (toast.exiting) {
      nextQueue.push(toast);
      continue;
    }

    // Hidden toasts never rendered, so they can drop without an exit animation.
    if (index + 1 > visibleCount) {
      changed = true;
      continue;
    }

    changed = true;
    nextQueue.push({
      ...toast,
      exiting: true,
      exitStartedAtMs: nowMs,
    });
  }

  return changed ? nextQueue : queue;
}

export function finalizeToast(queue: Array<ToastRecord>, id: string) {
  const nextQueue = queue.filter((toast) => !(toast.id === id && toast.exiting === true));
  return nextQueue.size() === queue.size() ? queue : nextQueue;
}

function shouldKeepExitingToast(toast: ToastRecord, nowMs: number, exitTimeoutMs: number) {
  const exitStartedAtMs = toast.exitStartedAtMs ?? nowMs;
  return nowMs - exitStartedAtMs < exitTimeoutMs;
}

export function pruneExpiredToasts(
  queue: Array<ToastRecord>,
  nowMs: number,
  maxVisible: number,
  defaultDurationMs: number,
  exitTimeoutMs = TOAST_EXIT_TIMEOUT_MS,
) {
  const visibleCount = math.max(1, maxVisible);
  let changed = false;

  const nextQueue: Array<ToastRecord> = [];
  for (let index = 0; index < queue.size(); index++) {
    const toast = queue[index];
    if (!toast) {
      continue;
    }

    if (toast.exiting) {
      if (shouldKeepExitingToast(toast, nowMs, exitTimeoutMs)) {
        nextQueue.push(toast);
      } else {
        changed = true;
      }
      continue;
    }

    if (index + 1 > visibleCount) {
      nextQueue.push(toast);
      continue;
    }

    // The expiry timer starts when the toast enters the visible window, not
    // when it was enqueued — toasts that waited behind maxVisible still get
    // their full display duration.
    let current = toast;
    if (current.visibleAtMs === undefined) {
      current = { ...current, visibleAtMs: nowMs };
      changed = true;
    }
    const visibleAtMs = current.visibleAtMs ?? nowMs;

    const duration = current.durationMs ?? defaultDurationMs;
    if (duration <= 0) {
      nextQueue.push(current);
      continue;
    }

    if (nowMs - visibleAtMs >= duration) {
      changed = true;
      nextQueue.push({
        ...current,
        exiting: true,
        exitStartedAtMs: nowMs,
      });
      continue;
    }

    nextQueue.push(current);
  }

  return changed ? nextQueue : queue;
}
