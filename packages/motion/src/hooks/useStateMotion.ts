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
  if (present !== lastPresent.current) {
    lastPresent.current = present;
    setPhase(present ? "entering" : "exiting");
  }

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
