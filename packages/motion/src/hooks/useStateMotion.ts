import { React } from "@lattice-ui/core";
import { useMotionController } from "../runtime/motion-controller";
import type { MotionPhase } from "../runtime/motion-phase";
import type { MotionConfig } from "../runtime/types";

export function useStateMotion<T extends Instance = Instance>(
  present: boolean,
  config: MotionConfig,
  appear: boolean = true,
) {
  const [phase, setPhase] = React.useState<"entering" | "entered" | "exiting">(
    present ? (appear ? "entering" : "entered") : "exiting",
  );

  const lastPresent = React.useRef(present);

  const syncPhaseToPresence = React.useCallback((nextPresent: boolean) => {
    setPhase((currentPhase) => {
      if (nextPresent) {
        if (currentPhase === "entering" || currentPhase === "entered") {
          return currentPhase;
        }

        return "entering";
      }

      if (currentPhase === "exiting") {
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
      if (currentPhase === "entering" && completedPhase === "entering") return "entered";
      return currentPhase;
    });
  }, []);

  const ref = React.useRef<T>();
  useMotionController(
    ref as React.MutableRefObject<Instance | undefined>,
    config,
    phase as MotionPhase,
    markPhaseComplete,
  );

  return ref;
}
