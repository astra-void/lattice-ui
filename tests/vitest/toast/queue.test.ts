import { describe, expect, it } from "vitest";
import {
  dequeueToast,
  enqueueToast,
  getVisibleToasts,
  pruneExpiredToasts,
} from "../../../packages/toast/src/Toast/queue";

describe("toast queue", () => {
  it("enqueues and dequeues items", () => {
    const first = { id: "a", createdAtMs: 0 };
    const second = { id: "b", createdAtMs: 0 };

    const queue = enqueueToast(enqueueToast([], first), second);
    expect(queue.map((item) => item.id)).toEqual(["a", "b"]);

    const dequeued = dequeueToast(queue);
    expect(dequeued.map((item) => item.id)).toEqual(["b"]);
  });

  it("respects maxVisible window", () => {
    const queue = [
      { id: "a", createdAtMs: 0 },
      { id: "b", createdAtMs: 0 },
      { id: "c", createdAtMs: 0 },
    ];

    expect(getVisibleToasts(queue, 2).map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("marks expired visible toasts as exiting before removing them", () => {
    const queue = [
      { id: "a", createdAtMs: 0, durationMs: 1000 },
      { id: "b", createdAtMs: 0, durationMs: 5000 },
      { id: "c", createdAtMs: 0, durationMs: 5000 },
    ];

    const pruned = pruneExpiredToasts(queue, 2000, 2, 4000);
    expect(pruned.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(pruned[0]?.exiting).toBe(true);
  });

  it("eventually removes exiting toasts after the exit window", () => {
    const queue = [
      { id: "a", createdAtMs: 0, durationMs: 1000, exiting: true, exitStartedAtMs: 0 },
      { id: "b", createdAtMs: 0, durationMs: 5000 },
    ];

    const pruned = pruneExpiredToasts(queue, 300, 2, 4000);
    expect(pruned.map((item) => item.id)).toEqual(["b"]);
  });
});
