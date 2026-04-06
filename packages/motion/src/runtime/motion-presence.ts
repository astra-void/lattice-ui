import { React } from "@lattice-ui/core";
import { type MotionPhase } from "./motion-phase";

export interface MotionPresenceOptions {
  present: boolean;
  appear?: boolean;
}

export function useMotionPresence(options: MotionPresenceOptions) {
  const { present, appear = true } = options;

  const [phase, setPhase] = React.useState<MotionPhase>(() => {
    if (!present) return "unmounted";
    return appear ? "entering" : "entered";
  });

  const lastPresent = React.useRef(present);
  const syncPhaseToPresence = React.useCallback((nextPresent: boolean) => {
    setPhase((currentPhase) => {
      if (nextPresent) {
        if (currentPhase === "entering" || currentPhase === "entered") {
          return currentPhase;
        }

        return "entering";
      }

      if (currentPhase === "exiting" || currentPhase === "unmounted") {
        return currentPhase;
      }

      return "exiting";
    });
  }, []);

  React.useLayoutEffect(() => {
    if (present === lastPresent.current) {
      return;
    }

    lastPresent.current = present;
    syncPhaseToPresence(present);
  }, [present, syncPhaseToPresence]);

  const markPhaseComplete = React.useCallback((completedPhase: MotionPhase) => {
    setPhase((currentPhase) => {
      if (currentPhase !== completedPhase) return currentPhase;
      if (currentPhase === "entering") return "entered";
      if (currentPhase === "exiting") return "unmounted";
      return currentPhase;
    });
  }, []);

  const isPresent = phase !== "unmounted";

  return { phase, isPresent, markPhaseComplete };
}
