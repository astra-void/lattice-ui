import { React } from "@lattice-ui/core";
import { useMotionPolicy } from "../core/policy";
import type { FeedbackEffectConfig, MotionStateTargets } from "../core/types";
import { MotionHost } from "../runtime/host";
import { applyFeedbackEffect } from "../runtime/feedback";

export function useFeedbackEffect<T extends Instance = Instance>(
  active: boolean,
  properties: MotionStateTargets,
  config?: FeedbackEffectConfig,
): React.MutableRefObject<T | undefined> {
  const ref = React.useRef<T>();
  const policy = useMotionPolicy();
  const motionHostRef = React.useRef<MotionHost>();

  React.useEffect(() => {
    return () => {
      motionHostRef.current?.stop();
      motionHostRef.current = undefined;
    };
  }, []);

  React.useLayoutEffect(() => {
    const instance = ref.current;
    if (!instance) {
      return;
    }

    if (!motionHostRef.current || motionHostRef.current.instance !== instance) {
      motionHostRef.current?.stop();
      motionHostRef.current = new MotionHost(instance, config?.target);
    } else {
      motionHostRef.current.setTargetContract(config?.target);
    }
    const motion = motionHostRef.current;

    const goals = active ? properties.active : properties.inactive;

    if (policy.disableAllMotion) {
      motion.sync(goals, "feedback", active ? "accent" : "recover", config?.target);
      return;
    }

    applyFeedbackEffect(
      motion,
      active ? "accent" : "recover",
      goals,
      active ? config?.accent : config?.recover,
      config?.target,
    );
  }, [active, properties, config, policy.disableAllMotion]);

  return ref;
}
