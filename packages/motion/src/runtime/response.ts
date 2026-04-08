import type { MotionIntent, MotionProperties } from "../core/types";
import { MotionHost } from "./host";
import { resolveResponseDriver } from "./spec";

export function settleResponse(host: MotionHost, values: MotionProperties | undefined, intent?: MotionIntent) {
  host.runFollow("response", values, resolveResponseDriver(intent));
}
