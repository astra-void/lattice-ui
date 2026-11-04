import { React } from "@lattice-ui/react-runtime";
import { useMotionPolicy } from "../core/policy";
import type { LoopMotionConfig } from "../core/types";
import { MotionHost } from "../runtime/host";
import { runLoop } from "../runtime/loop";

const MAX_MOUNT_ATTEMPTS = 120;

/**
 * Drives a continuous property loop (a spinner's rotation, a pulse) through the motion scheduler
 * while `active` is true.
 *
 * The loop stops and the instance rests at `config.from` when `active` is false or when the motion
 * policy disables motion (`MotionProvider disableAllMotion`, or the platform reduced-motion
 * setting). Re-rendering with a fresh config object of the same shape keeps the running cycle.
 */
export function useLoopMotion<T extends Instance = Instance>(
  active: boolean,
  config: LoopMotionConfig,
): React.MutableRefObject<T | undefined> {
  const ref = React.useRef<T>();
  const policy = useMotionPolicy();
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
    let mountAttempts = 0;

    const applyMotion = () => {
      if (setupGenerationRef.current !== generation) {
        return;
      }

      const instance = ref.current;
      if (!instance) {
        if (mountAttempts < MAX_MOUNT_ATTEMPTS) {
          mountAttempts += 1;
          task.delay(0, applyMotion);
        }
        return;
      }

      if (!motionHostRef.current || motionHostRef.current.instance !== instance) {
        motionHostRef.current?.stop();
        motionHostRef.current = new MotionHost(instance, config.target);
      } else {
        motionHostRef.current.setTargetContract(config.target);
      }

      const motion = motionHostRef.current;

      if (!active || policy.disableAllMotion) {
        motion.stop();
        motion.sync(config.from, "loop", "rest", config.target);
        return;
      }

      runLoop(motion, config);
    };

    applyMotion();
  }, [active, config, policy.disableAllMotion]);

  return ref;
}
