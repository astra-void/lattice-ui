import { describe, expect, it } from "vitest";
import {
  clearToasts,
  dequeueToast,
  enqueueToast,
  finalizeToast,
  getVisibleToasts,
  pruneExpiredToasts,
  TOAST_EXIT_TIMEOUT_MS,
} from "../../../packages/react/toast/src/Toast/queue";

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
      { id: "a", createdAtMs: 0, visibleAtMs: 0, durationMs: 1000 },
      { id: "b", createdAtMs: 0, visibleAtMs: 0, durationMs: 5000 },
      { id: "c", createdAtMs: 0, durationMs: 5000 },
    ];

    const pruned = pruneExpiredToasts(queue, 2000, 2, 4000);
    expect(pruned.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(pruned[0]?.exiting).toBe(true);
  });

  it("starts the expiry timer when a toast enters the visible window", () => {
    const queue = [
      { id: "a", createdAtMs: 0, visibleAtMs: 0, durationMs: 1000 },
      { id: "b", createdAtMs: 0, durationMs: 1000 },
    ];

    // "b" waits behind maxVisible while "a" expires; its timer must not run yet.
    let pruned = pruneExpiredToasts(queue, 5000, 1, 4000);
    expect(pruned[0]?.exiting).toBe(true);
    expect(pruned[1]?.visibleAtMs).toBeUndefined();

    pruned = finalizeToast(pruned, "a");
    expect(pruned.map((item) => item.id)).toEqual(["b"]);

    // Once visible, "b" is stamped and must survive despite its old createdAtMs.
    pruned = pruneExpiredToasts(pruned, 5100, 1, 4000);
    expect(pruned[0]?.visibleAtMs).toBe(5100);
    expect(pruned[0]?.exiting).toBeUndefined();

    // It only expires a full duration after becoming visible.
    pruned = pruneExpiredToasts(pruned, 6000, 1, 4000);
    expect(pruned[0]?.exiting).toBeUndefined();
    pruned = pruneExpiredToasts(pruned, 6100, 1, 4000);
    expect(pruned[0]?.exiting).toBe(true);
  });

  it("finalizes exiting toasts by id", () => {
    const queue = [
      { id: "a", createdAtMs: 0, exiting: true, exitStartedAtMs: 0 },
      { id: "b", createdAtMs: 0 },
    ];

    expect(finalizeToast(queue, "b")).toBe(queue);
    expect(finalizeToast(queue, "a").map((item) => item.id)).toEqual(["b"]);
  });

  it("clears visible toasts through the exit animation and drops hidden ones", () => {
    const queue = [
      { id: "a", createdAtMs: 0, visibleAtMs: 0 },
      { id: "b", createdAtMs: 0, visibleAtMs: 0, exiting: true, exitStartedAtMs: 100 },
      { id: "c", createdAtMs: 0 },
    ];

    const cleared = clearToasts(queue, 500, 2);
    expect(cleared.map((item) => item.id)).toEqual(["a", "b"]);
    expect(cleared[0]?.exiting).toBe(true);
    expect(cleared[0]?.exitStartedAtMs).toBe(500);
    expect(cleared[1]?.exitStartedAtMs).toBe(100);

    expect(clearToasts([], 500, 2)).toEqual([]);
  });

  it("removes stuck exiting toasts after the exit timeout fallback", () => {
    const queue = [
      { id: "a", createdAtMs: 0, visibleAtMs: 0, durationMs: 1000, exiting: true, exitStartedAtMs: 0 },
      { id: "b", createdAtMs: 0, visibleAtMs: 0, durationMs: 5000 },
    ];

    const stillAnimating = pruneExpiredToasts(queue, 300, 2, 4000);
    expect(stillAnimating.map((item) => item.id)).toEqual(["a", "b"]);

    const timedOut = pruneExpiredToasts(queue, TOAST_EXIT_TIMEOUT_MS, 2, 4000);
    expect(timedOut.map((item) => item.id)).toEqual(["b"]);
  });
});
