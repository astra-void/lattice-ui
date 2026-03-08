// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { Enum, RunService, installPreviewRuntimeGlobals, task } from "@lattice-ui/preview-runtime";

class RafController {
  private readonly callbacks = new Map<number, FrameRequestCallback>();
  private readonly originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
  private readonly originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  private readonly performanceNowMock = vi.spyOn(performance, "now").mockImplementation(() => this.now);
  private nextHandle = 1;
  private now = 0;

  public constructor() {
    globalThis.requestAnimationFrame = (callback) => {
      const handle = this.nextHandle++;
      this.callbacks.set(handle, callback);
      return handle;
    };

    globalThis.cancelAnimationFrame = (handle) => {
      this.callbacks.delete(handle);
    };
  }

  public get pendingCount() {
    return this.callbacks.size;
  }

  public async step(milliseconds: number) {
    this.now += milliseconds;

    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();

    for (const callback of callbacks) {
      callback(this.now);
    }

    await Promise.resolve();
  }

  public restore() {
    this.performanceNowMock.mockRestore();
    globalThis.requestAnimationFrame = this.originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = this.originalCancelAnimationFrame;
  }
}

let rafController: RafController | undefined;

afterEach(() => {
  rafController?.restore();
  rafController = undefined;
  vi.restoreAllMocks();
});

describe.sequential("@lattice-ui/preview-runtime", () => {
  it("provides a deep Enum proxy with stable Name and Value access", () => {
    expect(Enum.KeyCode.Return.Name).toBe("Return");
    expect(Enum.KeyCode.Return.EnumType.Name).toBe("KeyCode");
    expect(Enum.TextXAlignment.Center.Name).toBe("Center");
    expect(Enum.TextXAlignment.FromName("Left").Name).toBe("Left");
    expect(Enum.TextXAlignment.FromValue(7).Value).toBe(7);
    expect(String(Enum.KeyCode.Return)).toBe("Enum.KeyCode.Return");
    expect(Enum.KeyCode.Return.Value).toBeTypeOf("number");
  });

  it("shares one RAF loop between task.wait and RunService listeners", async () => {
    rafController = new RafController();

    const renderStepped = vi.fn();
    const connection = RunService.RenderStepped.Connect(renderStepped);
    const waitPromise = task.wait(0.03);

    expect(rafController.pendingCount).toBe(1);

    await rafController.step(16);

    expect(renderStepped).toHaveBeenCalledWith(0.016);
    expect(rafController.pendingCount).toBe(1);

    await rafController.step(18);

    await expect(waitPromise).resolves.toBeCloseTo(0.034, 3);

    connection.Disconnect();

    expect(rafController.pendingCount).toBe(0);
  });

  it("fires RenderStepped, Stepped, and Heartbeat every frame with delta time", async () => {
    rafController = new RafController();

    const order: string[] = [];
    const renderConnection = RunService.RenderStepped.Connect((deltaTime) => {
      order.push(`render:${deltaTime.toFixed(3)}`);
    });
    const steppedConnection = RunService.Stepped.Connect((time, deltaTime) => {
      order.push(`stepped:${time.toFixed(3)}:${deltaTime.toFixed(3)}`);
    });
    const heartbeatConnection = RunService.Heartbeat.Connect((deltaTime) => {
      order.push(`heartbeat:${deltaTime.toFixed(3)}`);
    });

    await rafController.step(20);

    expect(order).toEqual(["render:0.020", "stepped:0.020:0.020", "heartbeat:0.020"]);
    expect(RunService.IsClient()).toBe(true);
    expect(RunService.IsServer()).toBe(false);

    renderConnection.Disconnect();
    steppedConnection.Disconnect();
    heartbeatConnection.Disconnect();
  });

  it("uses RAF timing for task.wait and task.delay, and keeps spawn and defer isolated", async () => {
    rafController = new RafController();

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const events: string[] = [];

    const waitPromise = task.wait();
    const delayPromise = task.delay(
      0.025,
      (label: string) => {
        events.push(label);
      },
      "delayed",
    );

    task.spawn(
      (label: string) => {
        events.push(label);
      },
      "spawned",
    );
    task.spawn(() => {
      throw new Error("spawn failure");
    });
    task.defer(
      (label: string) => {
        events.push(label);
      },
      "deferred",
    );

    expect(events).toEqual(["spawned"]);

    await Promise.resolve();

    expect(events).toEqual(["spawned", "deferred"]);

    await rafController.step(16);

    await expect(waitPromise).resolves.toBeCloseTo(0.016, 3);
    expect(events).toEqual(["spawned", "deferred"]);

    await rafController.step(12);
    await delayPromise;

    expect(events).toEqual(["spawned", "deferred", "delayed"]);
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it("installs globals without overwriting an existing target", () => {
    const existingTask = {} as typeof task;
    const target = {
      task: existingTask,
    };

    installPreviewRuntimeGlobals(target);

    expect(target.Enum).toBe(Enum);
    expect(target.RunService).toBe(RunService);
    expect(target.task).toBe(existingTask);
  });
});
