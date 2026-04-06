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

  if (present !== lastPresent.current) {
    lastPresent.current = present;
    if (present) {
      setPhase("entering");
    } else {
      setPhase("exiting");
    }
  }

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
