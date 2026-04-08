import type { MotionDomain, MotionProperties } from "../core/types";
import { applyMotionCurve, type FollowDriverConfig, type TimedDriverConfig, type TimedStepName } from "./spec";
import { scheduleHost, unscheduleHost } from "./scheduler";
import {
  areMotionValuesEqual,
  interpolateMotionValue,
  isMotionValueSettled,
  readMotionProperty,
  writeMotionProperty,
} from "../targets/instance";

type MotionTrack =
  | {
      mode: "timed";
      key: string;
      domain: MotionDomain;
      from: unknown;
      target: unknown;
      current: unknown;
      applied: unknown;
      elapsed: number;
      config: TimedDriverConfig;
      onComplete?: () => void;
    }
  | {
      mode: "follow";
      key: string;
      domain: MotionDomain;
      target: unknown;
      current: unknown;
      applied: unknown;
      config: FollowDriverConfig;
    };

function isCollectionEmpty(collection: Map<unknown, unknown>) {
  const candidate = collection as { size: number | (() => number) };
  return typeIs(candidate.size, "function") ? candidate.size() === 0 : candidate.size === 0;
}

export class MotionHost {
  private readonly tracks = new Map<string, MotionTrack>();

  public constructor(public readonly instance: Instance) {}

  public sync(values?: MotionProperties) {
    if (!values) {
      return;
    }

    for (const [key, value] of pairs(values)) {
      this.setImmediate(key, value);
    }
  }

  public runTimed(
    domain: MotionDomain,
    step: TimedStepName,
    values: MotionProperties | undefined,
    config: TimedDriverConfig,
    onComplete?: () => void,
  ) {
    if (!values) {
      onComplete?.();
      return;
    }

    let pending = 0;
    let completed = false;

    const notifyComplete = () => {
      pending -= 1;
      if (pending <= 0 && !completed) {
        completed = true;
        onComplete?.();
      }
    };

    for (const [key, value] of pairs(values)) {
      pending += 1;
      this.setTimedTrack(domain, step, key, value, config, notifyComplete);
    }

    if (pending === 0) {
      onComplete?.();
    }
  }

  public runFollow(domain: MotionDomain, values: MotionProperties | undefined, config: FollowDriverConfig) {
    if (!values) {
      return;
    }

    for (const [key, value] of pairs(values)) {
      this.setFollowTrack(domain, key, value, config);
    }
  }

  public stop() {
    if (!isCollectionEmpty(this.tracks)) {
      this.tracks.clear();
      unscheduleHost(this);
    }
  }

  public step(dt: number) {
    let active = false;
    const completedTracks = new Array<MotionTrack>();

    for (const [key, track] of this.tracks) {
      let nextValue: unknown;
      let finished = false;

      if (track.mode === "timed") {
        track.elapsed += dt;
        const alpha = track.config.duration <= 0 ? 1 : math.clamp(track.elapsed / track.config.duration, 0, 1);
        const curved = applyMotionCurve(track.config.curve, alpha);

        nextValue = interpolateMotionValue(track.from, track.target, curved);
        if (alpha >= 1 || areMotionValuesEqual(nextValue, track.target)) {
          nextValue = track.target;
          finished = true;
        }
      } else {
        const alpha = track.config.halfLife <= 0 ? 1 : 1 - math.pow(2, -dt / track.config.halfLife);

        nextValue = interpolateMotionValue(track.current, track.target, alpha);
        if (isMotionValueSettled(nextValue, track.target, track.config.precision)) {
          nextValue = track.target;
          finished = true;
        }
      }

      if (!areMotionValuesEqual(nextValue, track.applied)) {
        const wrote = writeMotionProperty(this.instance, key, nextValue);
        if (!wrote) {
          finished = true;
        }
      }

      track.current = nextValue;
      track.applied = nextValue;

      if (finished) {
        completedTracks.push(track);
      } else {
        active = true;
      }
    }

    for (const track of completedTracks) {
      this.tracks.delete(track.key);
      if (track.mode === "timed" && track.onComplete) {
        task.defer(track.onComplete);
      }
    }

    return active;
  }

  private setImmediate(key: string, value: unknown) {
    const current = this.tracks.get(key)?.applied ?? readMotionProperty(this.instance, key);

    if (!areMotionValuesEqual(current, value)) {
      writeMotionProperty(this.instance, key, value);
    }

    this.tracks.delete(key);

    if (isCollectionEmpty(this.tracks)) {
      unscheduleHost(this);
    }
  }

  private setTimedTrack(
    domain: MotionDomain,
    step: TimedStepName,
    key: string,
    target: unknown,
    config: TimedDriverConfig,
    onComplete?: () => void,
  ) {
    const existing = this.tracks.get(key);
    const current = existing?.current ?? readMotionProperty(this.instance, key);

    if (areMotionValuesEqual(current, target)) {
      this.setImmediate(key, target);
      onComplete?.();
      return;
    }

    this.tracks.set(key, {
      mode: "timed",
      key,
      domain,
      from: current,
      target,
      current,
      applied: current,
      elapsed: 0,
      config,
      onComplete,
    });

    if (step === "exit" && config.duration <= 0) {
      this.setImmediate(key, target);
      onComplete?.();
      return;
    }

    scheduleHost(this);
  }

  private setFollowTrack(domain: MotionDomain, key: string, target: unknown, config: FollowDriverConfig) {
    const existing = this.tracks.get(key);
    const current = existing?.current ?? readMotionProperty(this.instance, key);

    if (areMotionValuesEqual(current, target)) {
      this.setImmediate(key, target);
      return;
    }

    this.tracks.set(key, {
      mode: "follow",
      key,
      domain,
      target,
      current,
      applied: current,
      config,
    });

    scheduleHost(this);
  }
}
