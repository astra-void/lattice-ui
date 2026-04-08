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
      motionHostRef.current = new MotionHost(instance);
    }
    const motion = motionHostRef.current;

    const goals = active ? properties.active : properties.inactive;

    if (policy.disableAllMotion) {
      motion.sync(goals);
      return;
    }

    settleResponse(motion, goals, config?.settle);
  }, [active, properties, config, policy.disableAllMotion]);

  return ref;
}
