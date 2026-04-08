import { RunService } from "@rbxts/services";
import type { MotionHost } from "./host";

const activeHosts = new Set<MotionHost>();
let connection: RBXScriptConnection | undefined;

function getCollectionSize<T>(collection: Set<T> | Map<unknown, unknown>) {
  const candidate = collection as { size: number | (() => number) };
  return typeIs(candidate.size, "function") ? candidate.size() : candidate.size;
}

function onRenderStepped(dt: number) {
  for (const host of activeHosts) {
    const stillActive = host.step(dt);
    if (!stillActive) {
      activeHosts.delete(host);
    }
  }

  if (getCollectionSize(activeHosts) === 0 && connection) {
    connection.Disconnect();
    connection = undefined;
  }
}

export function scheduleHost(host: MotionHost) {
  activeHosts.add(host);
  if (!connection) {
    connection = RunService.RenderStepped.Connect(onRenderStepped);
  }
}

export function unscheduleHost(host: MotionHost) {
  activeHosts.delete(host);

  if (getCollectionSize(activeHosts) === 0 && connection) {
    connection.Disconnect();
    connection = undefined;
  }
}
