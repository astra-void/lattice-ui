import { React } from "@lattice-ui/core";
import { applyMotionProperties } from "../targets/apply";
import { type MotionPhase } from "./motion-phase";
import { useMotionPolicy } from "./motion-policy";
import { type MotionConfig } from "./types";

const TweenService = game.GetService("TweenService");

export function useMotionController(
  ref: React.MutableRefObject<Instance | undefined>,
  config: MotionConfig,
  phase: MotionPhase,
  onPhaseComplete: (phase: MotionPhase) => void,
) {
  const policy = useMotionPolicy();
  const tweenRef = React.useRef<Tween>();
  const connectionRef = React.useRef<RBXScriptConnection>();
  const onPhaseCompleteRef = React.useRef(onPhaseComplete);

  React.useEffect(() => {
    onPhaseCompleteRef.current = onPhaseComplete;
  }, [onPhaseComplete]);

  const clearTween = React.useCallback(() => {
    if (tweenRef.current) {
      tweenRef.current.Cancel();
      tweenRef.current = undefined;
    }
    if (connectionRef.current) {
      connectionRef.current.Disconnect();
      connectionRef.current = undefined;
    }
  }, []);

  React.useEffect(() => {
    return clearTween;
  }, [clearTween]);

  React.useLayoutEffect(() => {
    const instance = ref.current;
    if (!instance || phase === "unmounted") return;

    clearTween();

    const phaseConfig = config[phase];
    if (!phaseConfig) {
      onPhaseCompleteRef.current(phase);
      return;
    }

    if (policy.disableAllMotion || !phaseConfig.tweenInfo) {
      applyMotionProperties(instance, phaseConfig.initial);
      applyMotionProperties(instance, phaseConfig.goals);
      onPhaseCompleteRef.current(phase);
      return;
    }

    applyMotionProperties(instance, phaseConfig.initial);

    if (!phaseConfig.goals) {
      onPhaseCompleteRef.current(phase);
      return;
    }

    const tween = TweenService.Create(instance, phaseConfig.tweenInfo, phaseConfig.goals as never);
    tweenRef.current = tween;
    connectionRef.current = tween.Completed.Connect((playbackState) => {
      if (playbackState === Enum.PlaybackState.Completed) {
        onPhaseCompleteRef.current(phase);
      }
    });

    tween.Play();
  }, [ref, config, phase, policy.disableAllMotion, clearTween]);
}
