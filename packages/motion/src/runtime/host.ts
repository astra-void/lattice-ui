import type { MotionDomain, MotionProperties, MotionTargetContract } from "../core/types";
import { reportMotionDiagnostic } from "./diagnostics";
import { applyMotionCurve, type FollowDriverConfig, type TimedDriverConfig, type TimedStepName } from "./spec";
import { scheduleHost, unscheduleHost } from "./scheduler";
import {
  areMotionValuesEqual,
  canInterpolateMotionValue,
  interpolateMotionValue,
  isMotionValueSettled,
  readMotionProperty,
  type MotionPropertyContext,
  writeMotionProperty,
} from "../targets/instance";

type MotionTrack =
  | {
      mode: "timed";
      key: string;
      domain: MotionDomain;
      phase: string;
      targetContract?: MotionTargetContract;
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
      phase: string;
      targetContract?: MotionTargetContract;
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

  public constructor(
    public readonly instance: Instance,
    private targetContract?: MotionTargetContract,
  ) {}

  public setTargetContract(targetContract: MotionTargetContract | undefined) {
    this.targetContract = targetContract;
  }

  public sync(
    values?: MotionProperties,
    domain: MotionDomain = "presence",
    phase = "snapshot",
    targetContract?: MotionTargetContract,
  ) {
    if (!values) {
      return;
    }

    for (const [key, value] of pairs(values)) {
      this.setImmediate(domain, phase, key, value, targetContract);
    }
  }

  public runTimed(
    domain: MotionDomain,
    step: TimedStepName,
    values: MotionProperties | undefined,
    config: TimedDriverConfig,
    onComplete?: () => void,
    targetContract?: MotionTargetContract,
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
      if (this.setTimedTrack(domain, step, key, value, config, notifyComplete, targetContract)) {
        pending += 1;
      }
    }

    if (pending === 0) {
      onComplete?.();
    }
  }

  public runFollow(
    domain: MotionDomain,
    values: MotionProperties | undefined,
    config: FollowDriverConfig,
    targetContract?: MotionTargetContract,
  ) {
    if (!values) {
      return;
    }

    for (const [key, value] of pairs(values)) {
      this.setFollowTrack(domain, key, value, config, targetContract);
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

        nextValue = interpolateMotionValue(track.from, track.target, curved, this.createContext(track, track.key));
        if (alpha >= 1 || areMotionValuesEqual(nextValue, track.target)) {
          nextValue = track.target;
          finished = true;
        }
      } else {
        const alpha = track.config.halfLife <= 0 ? 1 : 1 - math.pow(2, -dt / track.config.halfLife);

        nextValue = interpolateMotionValue(track.current, track.target, alpha, this.createContext(track, track.key));
        if (isMotionValueSettled(nextValue, track.target, track.config.precision)) {
          nextValue = track.target;
          finished = true;
        }
      }

      if (!areMotionValuesEqual(nextValue, track.applied)) {
        const wrote = writeMotionProperty(this.instance, key, nextValue, this.createContext(track, key));
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

  private createContext(
    track: Pick<MotionTrack, "domain" | "phase" | "targetContract">,
    propertyKey: string,
  ): MotionPropertyContext & { propertyKey: string } {
    return {
      domain: track.domain,
      phase: track.phase,
      instance: this.instance,
      propertyKey,
      target: track.targetContract ?? this.targetContract,
    };
  }

  private createOperationContext(
    domain: MotionDomain,
    phase: string,
    propertyKey: string,
    targetContract?: MotionTargetContract,
  ): MotionPropertyContext & { propertyKey: string } {
    return {
      domain,
      phase,
      instance: this.instance,
      propertyKey,
      target: targetContract ?? this.targetContract,
    };
  }

  private reportConflict(
    existing: MotionTrack | undefined,
    domain: MotionDomain,
    phase: string,
    key: string,
    targetContract?: MotionTargetContract,
  ) {
    if (!existing || existing.domain === domain) {
      return;
    }

    reportMotionDiagnostic({
      domain,
      phase,
      stage: "conflict",
      propertyKey: key,
      instance: this.instance,
      target: targetContract ?? this.targetContract,
      detail: `property is already controlled by ${existing.domain}/${existing.phase}`,
    });
  }

  private setImmediate(
    domain: MotionDomain,
    phase: string,
    key: string,
    value: unknown,
    targetContract?: MotionTargetContract,
  ) {
    const context = this.createOperationContext(domain, phase, key, targetContract);
    const current = this.tracks.get(key)?.applied ?? readMotionProperty(this.instance, key, context);

    if (!areMotionValuesEqual(current, value)) {
      writeMotionProperty(this.instance, key, value, context);
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
    targetContract?: MotionTargetContract,
  ) {
    const existing = this.tracks.get(key);
    this.reportConflict(existing, domain, step, key, targetContract);

    const context = this.createOperationContext(domain, step, key, targetContract);
    const current = existing?.current ?? readMotionProperty(this.instance, key, context);

    if (current === undefined) {
      return false;
    }

    if (areMotionValuesEqual(current, target)) {
      this.setImmediate(domain, step, key, target, targetContract);
      return false;
    }

    if (!canInterpolateMotionValue(current, target)) {
      interpolateMotionValue(current, target, 0.5, context);
      this.setImmediate(domain, step, key, target, targetContract);
      return false;
    }

    this.tracks.set(key, {
      mode: "timed",
      key,
      domain,
      phase: step,
      targetContract: targetContract ?? this.targetContract,
      from: current,
      target,
      current,
      applied: current,
      elapsed: 0,
      config,
      onComplete,
    });

    if (config.duration <= 0) {
      this.setImmediate(domain, step, key, target, targetContract);
      return false;
    }

    scheduleHost(this);
    return true;
  }

  private setFollowTrack(
    domain: MotionDomain,
    key: string,
    target: unknown,
    config: FollowDriverConfig,
    targetContract?: MotionTargetContract,
  ) {
    const existing = this.tracks.get(key);
    this.reportConflict(existing, domain, "settle", key, targetContract);

    const context = this.createOperationContext(domain, "settle", key, targetContract);
    const current = existing?.current ?? readMotionProperty(this.instance, key, context);

    if (current === undefined) {
      return;
    }

    if (areMotionValuesEqual(current, target)) {
      this.setImmediate(domain, "settle", key, target, targetContract);
      return;
    }

    if (!canInterpolateMotionValue(current, target)) {
      interpolateMotionValue(current, target, 0.5, context);
      this.setImmediate(domain, "settle", key, target, targetContract);
      return;
    }

    this.tracks.set(key, {
      mode: "follow",
      key,
      domain,
      phase: "settle",
      targetContract: targetContract ?? this.targetContract,
      target,
      current,
      applied: current,
      config,
    });

    scheduleHost(this);
  }
}
