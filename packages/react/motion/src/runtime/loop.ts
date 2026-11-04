import type { LoopMotionConfig } from "../core/types";
import type { MotionHost } from "./host";
import { resolveLoopDriver } from "./spec";

export function runLoop(host: MotionHost, config: LoopMotionConfig) {
  host.runLoop("loop", config.from, config.to, resolveLoopDriver(config.duration, config.repeat), config.target);
}
