import React from "@rbxts/react";

import { useMotionPolicy } from "./policy";
import { applyMotionProperties, isMotionTransition } from "./transition";
import type { MotionTransition, UseMotionTweenOptions } from "./types";

function getTweenService() {
  return game.GetService("TweenService") as TweenService;
}

function isTweenCompleted(state: unknown) {
  return state === Enum.PlaybackState.Completed;
}

function clearTweenState(
  tweenRef: React.MutableRefObject<Tween | undefined>,
  completedConnectionRef: React.MutableRefObject<RBXScriptConnection | undefined>,
) {
  const tween = tweenRef.current;
  if (tween) {
    tween.Cancel();
    tweenRef.current = undefined;
  }

  const connection = completedConnectionRef.current;
  if (connection) {
    connection.Disconnect();
    completedConnectionRef.current = undefined;
  }
}

function playTween(
  instance: Instance,
  tweenInfo: TweenInfo,
  goals: Record<string, unknown>,
  tweenRef: React.MutableRefObject<Tween | undefined>,
  completedConnectionRef: React.MutableRefObject<RBXScriptConnection | undefined>,
  onCompleted?: () => void,
) {
  clearTweenState(tweenRef, completedConnectionRef);

  const tween = getTweenService().Create(instance, tweenInfo, goals as never);
  tweenRef.current = tween;

  if (onCompleted) {
    completedConnectionRef.current = tween.Completed.Connect((playbackState) => {
      if (isTweenCompleted(playbackState)) {
        onCompleted();
      }
    });
  }

  tween.Play();
}

export function useMotionTween(ref: React.MutableRefObject<Instance | undefined>, options: UseMotionTweenOptions) {
  const policy = useMotionPolicy();
  const tweenRef = React.useRef<Tween>();
  const completedConnectionRef = React.useRef<RBXScriptConnection>();
  const initializedRef = React.useRef(false);
  const lastActiveRef = React.useRef<boolean | undefined>(undefined);
  const lastTransitionRef = React.useRef<MotionTransition | false | undefined>(options.transition);
  const onExitCompleteRef = React.useRef(options.onExitComplete);

  React.useEffect(() => {
    onExitCompleteRef.current = options.onExitComplete;
  }, [options.onExitComplete]);

  React.useEffect(() => {
    return () => {
      clearTweenState(tweenRef, completedConnectionRef);
    };
  }, []);

  React.useLayoutEffect(() => {
    const instance = ref.current;
    if (!instance) {
      return;
    }

    const transition = options.transition;
    const isInitialRender = !initializedRef.current;
    const motionDisabled = policy.disableAllMotion || transition === false || !isMotionTransition(transition);
    const shouldUpdate =
      isInitialRender || lastActiveRef.current !== options.active || lastTransitionRef.current !== transition;

    if (!shouldUpdate) {
      return;
    }

    initializedRef.current = true;
    const previousActive = lastActiveRef.current;
    const activeChanged = previousActive !== options.active;
    lastActiveRef.current = options.active;
    lastTransitionRef.current = transition;

    clearTweenState(tweenRef, completedConnectionRef);

    if (motionDisabled) {
      const motionTransition = transition as MotionTransition | undefined;
      const fallbackFrame = options.active ? motionTransition?.enter?.to : motionTransition?.exit?.to;
      applyMotionProperties(instance, fallbackFrame);
      if (!options.active && !isInitialRender) {
        onExitCompleteRef.current?.();
      }
      return;
    }

    const motionTransition = transition as MotionTransition;
    const phaseKeyframe = motionTransition[options.active ? "enter" : "exit"];
    if (!phaseKeyframe?.to) {
      if (!options.active && !isInitialRender) {
        onExitCompleteRef.current?.();
      }
      return;
    }

    if (isInitialRender && !options.active) {
      applyMotionProperties(instance, phaseKeyframe.to);
      return;
    }

    if (phaseKeyframe.from && (isInitialRender ? options.active : activeChanged)) {
      applyMotionProperties(instance, phaseKeyframe.from);
    }

    if (!phaseKeyframe.tweenInfo) {
      applyMotionProperties(instance, phaseKeyframe.to);
      if (!options.active && !isInitialRender) {
        onExitCompleteRef.current?.();
      }
      return;
    }

    const completion = options.active ? undefined : () => onExitCompleteRef.current?.();
    playTween(instance, phaseKeyframe.tweenInfo, phaseKeyframe.to, tweenRef, completedConnectionRef, completion);
  }, [options.active, options.transition, policy.disableAllMotion, ref]);
}
