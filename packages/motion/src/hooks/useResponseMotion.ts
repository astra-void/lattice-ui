import { React } from "@lattice-ui/core";
import { useMotionPolicy } from "../core/policy";
import type { MotionStateTargets, ResponseMotionConfig } from "../core/types";
import { MotionHost } from "../runtime/host";
import { settleResponse } from "../runtime/response";

export function useResponseMotion<T extends Instance = Instance>(
  active: boolean,
  properties: MotionStateTargets,
  config?: ResponseMotionConfig,
): React.MutableRefObject<T | undefined> {
  const ref = React.useRef<T>();
  const policy = useMotionPolicy();
  const isFirstMount = React.useRef(true);
  const motionHostRef = React.useRef<MotionHost>();
  const setupGenerationRef = React.useRef(0);

  React.useEffect(() => {
    return () => {
      motionHostRef.current?.stop();
      motionHostRef.current = undefined;
    };
  }, []);

  React.useLayoutEffect(() => {
    setupGenerationRef.current += 1;
    const generation = setupGenerationRef.current;

    const applyMotion = () => {
      if (setupGenerationRef.current !== generation) {
        return;
      }

      const instance = ref.current;
      if (!instance) {
        task.delay(0, applyMotion);
        return;
      }

      if (!motionHostRef.current || motionHostRef.current.instance !== instance) {
        motionHostRef.current?.stop();
        motionHostRef.current = new MotionHost(instance);
        isFirstMount.current = true;
      }

      const motion = motionHostRef.current;
      const goals = active ? properties.active : properties.inactive;

      if (isFirstMount.current) {
        isFirstMount.current = false;
        motion.sync(goals);
        return;
      }

      if (policy.disableAllMotion) {
        motion.sync(goals);
        return;
      }

      settleResponse(motion, goals, config?.settle);
    };

    applyMotion();
  }, [active, properties, config, policy.disableAllMotion]);

  return ref;
}
