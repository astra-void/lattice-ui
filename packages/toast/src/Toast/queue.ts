export type ToastRecord = {
  id: string;
  title?: string;
  description?: string;
  durationMs?: number;
  createdAtMs: number;
};

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

export function pruneExpiredToasts(
  queue: Array<ToastRecord>,
  nowMs: number,
  maxVisible: number,
  defaultDurationMs: number,
) {
  const visibleCount = math.max(1, maxVisible);
  let changed = false;

  const nextQueue: Array<ToastRecord> = [];
  for (let index = 0; index < queue.size(); index++) {
    const toast = queue[index];
    if (!toast) {
      continue;
    }

    if (index + 1 > visibleCount) {
      nextQueue.push(toast);
      continue;
    }

    const duration = toast.durationMs ?? defaultDurationMs;
    if (duration <= 0) {
      nextQueue.push(toast);
      continue;
    }

    if (nowMs - toast.createdAtMs >= duration) {
      changed = true;
      continue;
    }

    nextQueue.push(toast);
  }

  return changed ? nextQueue : queue;
}
