import { React } from "@lattice-ui/core";
import { useMotionPolicy } from "../core/policy";
import type { PresenceMotionConfig } from "../core/types";
import { MotionHost } from "../runtime/host";
import { applyPresenceSnapshot, exitPresence, revealPresence } from "../runtime/presence";

export function usePresenceMotion<T extends Instance = Instance>(
  present: boolean,
  config: PresenceMotionConfig,
  onExitComplete?: () => void,
): React.MutableRefObject<T | undefined> {
  const ref = React.useRef<T>();
  const policy = useMotionPolicy();
  const onExitCompleteRef = React.useRef(onExitComplete);
  const isFirstMount = React.useRef(true);
  const motionHostRef = React.useRef<MotionHost>();

  React.useEffect(() => {
    onExitCompleteRef.current = onExitComplete;
  }, [onExitComplete]);

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
      isFirstMount.current = true;
    }
    const motion = motionHostRef.current;

    if (isFirstMount.current) {
      isFirstMount.current = false;

      applyPresenceSnapshot(motion, config.initial);

      if (present && config.reveal) {
        if (policy.disableAllMotion) {
          applyPresenceSnapshot(motion, config.reveal.values);
        } else {
          revealPresence(motion, config.reveal.values, config.reveal.intent);
        }
      } else if (!present) {
        applyPresenceSnapshot(motion, config.exit?.values ?? config.initial);
      }

      return;
    }

    if (present) {
      if (config.reveal) {
        if (policy.disableAllMotion) {
          applyPresenceSnapshot(motion, config.reveal.values);
        } else {
          revealPresence(motion, config.reveal.values, config.reveal.intent);
        }
      }
    } else {
      if (config.exit) {
        if (policy.disableAllMotion) {
          applyPresenceSnapshot(motion, config.exit.values);
          onExitCompleteRef.current?.();
        } else {
          exitPresence(motion, config.exit.values, config.exit.intent, () => onExitCompleteRef.current?.());
        }
      } else {
        onExitCompleteRef.current?.();
      }
    }
  }, [present, config, policy.disableAllMotion]);

  return ref;
}
