import { React } from "@lattice-ui/core";
import { useMotionPolicy } from "../core/policy";
import type { PresenceMotionConfig, PresenceMotionPhase } from "../core/types";
import { MotionHost } from "../runtime/host";
import { applyPresenceSnapshot, exitPresence, revealPresence } from "../runtime/presence";

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
  const motionHostRef = React.useRef<MotionHost>();
  const setupGenerationRef = React.useRef(0);
  const hasEnteredRef = React.useRef(options.present);
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

    const completeExit = () => {
      if (setupGenerationRef.current !== generation) {
        return;
      }

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

      const instance = ref.current;
      if (!instance) {
        if (!options.present && phaseRef.current !== "exited") {
          completeExit();
          return;
        }

        if (mounted) {
          task.delay(0, applyMotion);
        }
        return;
      }

      if (!motionHostRef.current || motionHostRef.current.instance !== instance) {
        motionHostRef.current?.stop();
        motionHostRef.current = new MotionHost(instance, options.config.target);
        hasEnteredRef.current = false;
      } else {
        motionHostRef.current.setTargetContract(options.config.target);
      }
      const motion = motionHostRef.current;

      if (options.present) {
        const entering = !hasEnteredRef.current || phaseRef.current === "exited" || phaseRef.current === "exiting";

        if (entering) {
          setPhase("mounted");
          applyPresenceSnapshot(motion, options.config.initial, "initial", options.config.target);
        }

        if (!ready) {
          setPhase("preparing");
          return;
        }

        setPhase("ready");
        hasEnteredRef.current = true;

        const revealTarget = options.config.reveal?.target ?? options.config.target;

        if (!options.config.reveal) {
          completeReveal();
          return;
        }

        if (policy.disableAllMotion) {
          applyPresenceSnapshot(motion, options.config.reveal.values, "reveal", revealTarget);
          completeReveal();
          return;
        }

        revealPresence(
          motion,
          options.config.reveal.values,
          options.config.reveal.intent,
          completeReveal,
          revealTarget,
        );
        return;
      }

      if (phaseRef.current === "exited" && !hasEnteredRef.current) {
        if (options.forceMount) {
          applyPresenceSnapshot(
            motion,
            options.config.exit?.values ?? options.config.initial,
            "exited",
            options.config.exit?.target ?? options.config.target,
          );
        }
        return;
      }

      setPhase("exiting");

      if (!options.config.exit) {
        completeExit();
        return;
      }

      const exitTarget = options.config.exit.target ?? options.config.target;

      if (policy.disableAllMotion) {
        applyPresenceSnapshot(motion, options.config.exit.values, "exit", exitTarget);
        completeExit();
        return;
      }

      exitPresence(motion, options.config.exit.values, options.config.exit.intent, completeExit, exitTarget);
    };

    applyMotion();
  }, [mounted, options.config, options.forceMount, options.present, policy.disableAllMotion, ready, setPhase]);

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
