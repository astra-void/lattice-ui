import { React } from "@lattice-ui/react-runtime";
import { useMotionPolicy } from "../core/policy";
import type { PresenceMotionConfig, PresenceMotionPhase } from "../core/types";
import { MotionHost } from "../runtime/host";
import { applyPresenceSnapshot, exitPresence, revealPresence } from "../runtime/presence";

const MAX_MOUNT_ATTEMPTS = 120;

export interface PresenceMotionControllerOptions {
  present: boolean;
  config: PresenceMotionConfig;
  ready?: boolean;
  forceMount?: boolean;
  onExitComplete?: () => void;
}

export interface PresenceMotionController<T extends Instance = Instance> {
  ref: React.MutableRefObject<T | undefined>;
  phase: PresenceMotionPhase;
  mounted: boolean;
  ready: boolean;
  present: boolean;
  isExiting: boolean;
  isVisible: boolean;
  markReady: () => void;
}

export function usePresenceMotionController<T extends Instance = Instance>(
  options: PresenceMotionControllerOptions,
): PresenceMotionController<T> {
  const ref = React.useRef<T>();
  const policy = useMotionPolicy();
  const onExitCompleteRef = React.useRef(options.onExitComplete);
  // Consumers commonly build the config inline (`transition={createRecipe()}`),
  // so its identity changes on every render. Read it through a ref: presence
  // motion re-runs on semantic changes (present/ready/policy), never on a fresh
  // config object, or a re-render mid-reveal would restart the reveal.
  const configRef = React.useRef(options.config);
  configRef.current = options.config;
  const motionHostRef = React.useRef<MotionHost>();
  const setupGenerationRef = React.useRef(0);
  const completedExitGenerationRef = React.useRef<number>();
  const hasEnteredRef = React.useRef(false);
  const phaseRef = React.useRef<PresenceMotionPhase>(options.present ? "mounted" : "exited");
  const [phase, setPhaseState] = React.useState<PresenceMotionPhase>(phaseRef.current);
  const [markedReady, setMarkedReady] = React.useState(options.ready ?? true);

  const ready = options.ready !== undefined ? options.ready : markedReady;
  const mounted = options.forceMount === true || options.present || phase !== "exited";

  const setPhase = React.useCallback((nextPhase: PresenceMotionPhase) => {
    phaseRef.current = nextPhase;
    setPhaseState((current) => (current === nextPhase ? current : nextPhase));
  }, []);

  const markReady = React.useCallback(() => {
    setMarkedReady(true);
  }, []);

  React.useEffect(() => {
    onExitCompleteRef.current = options.onExitComplete;
  }, [options.onExitComplete]);

  React.useEffect(() => {
    if (options.ready !== undefined) {
      setMarkedReady(options.ready);
    }
  }, [options.ready]);

  React.useEffect(() => {
    return () => {
      setupGenerationRef.current += 1;
      motionHostRef.current?.stop();
      motionHostRef.current = undefined;
    };
  }, []);

  React.useLayoutEffect(() => {
    setupGenerationRef.current += 1;
    const generation = setupGenerationRef.current;
    let mountAttempts = 0;

    const completeExit = () => {
      if (setupGenerationRef.current !== generation) {
        return;
      }

      if (completedExitGenerationRef.current === generation) {
        return;
      }
      completedExitGenerationRef.current = generation;

      hasEnteredRef.current = false;
      setPhase("exited");
      onExitCompleteRef.current?.();
    };

    const completeReveal = () => {
      if (setupGenerationRef.current !== generation) {
        return;
      }

      setPhase("visible");
    };

    const applyMotion = () => {
      if (setupGenerationRef.current !== generation) {
        return;
      }

      const config = configRef.current;
      const instance = ref.current;
      if (!instance) {
        if (!options.present && phaseRef.current !== "exited") {
          completeExit();
          return;
        }

        if (mounted && mountAttempts < MAX_MOUNT_ATTEMPTS) {
          mountAttempts += 1;
          task.delay(0, applyMotion);
        }
        return;
      }

      if (!motionHostRef.current || motionHostRef.current.instance !== instance) {
        motionHostRef.current?.stop();
        motionHostRef.current = new MotionHost(instance, config.target);
        hasEnteredRef.current = false;
      } else {
        motionHostRef.current.setTargetContract(config.target);
      }
      const motion = motionHostRef.current;

      if (options.present) {
        completedExitGenerationRef.current = undefined;
        // Only a real enter (first mount, or after a completed exit) starts from
        // `initial`. A reveal already in flight, or a reopen mid-exit, is
        // retargeted from the instance's current values instead of snapping back.
        const entering = !hasEnteredRef.current;

        if (entering) {
          setPhase("mounted");
          applyPresenceSnapshot(motion, config.initial, "initial", config.target);
        }

        if (!ready) {
          setPhase("preparing");
          return;
        }

        setPhase("ready");
        hasEnteredRef.current = true;

        const revealTarget = config.reveal?.target ?? config.target;

        if (!config.reveal) {
          completeReveal();
          return;
        }

        if (policy.disableAllMotion) {
          applyPresenceSnapshot(motion, config.reveal.values, "reveal", revealTarget);
          completeReveal();
          return;
        }

        revealPresence(motion, config.reveal.values, config.reveal.intent, completeReveal, revealTarget);
        return;
      }

      if (phaseRef.current === "exited" && !hasEnteredRef.current) {
        if (options.forceMount) {
          applyPresenceSnapshot(
            motion,
            config.exit?.values ?? config.initial,
            "exited",
            config.exit?.target ?? config.target,
          );
        }
        return;
      }

      setPhase("exiting");

      if (!config.exit) {
        completeExit();
        return;
      }

      const exitTarget = config.exit.target ?? config.target;

      if (policy.disableAllMotion) {
        applyPresenceSnapshot(motion, config.exit.values, "exit", exitTarget);
        completeExit();
        return;
      }

      exitPresence(motion, config.exit.values, config.exit.intent, completeExit, exitTarget);
    };

    applyMotion();
  }, [mounted, options.forceMount, options.present, policy.disableAllMotion, ready, setPhase]);

  return {
    ref,
    phase,
    mounted,
    ready,
    present: options.present,
    isExiting: phase === "exiting",
    isVisible: phase === "ready" || phase === "visible",
    markReady,
  };
}

export function usePresenceMotion<T extends Instance = Instance>(
  present: boolean,
  config: PresenceMotionConfig,
  onExitComplete?: () => void,
): React.MutableRefObject<T | undefined> {
  return usePresenceMotionController<T>({
    present,
    config,
    forceMount: true,
    onExitComplete,
  }).ref;
}
