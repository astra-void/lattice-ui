import { React } from "@lattice-ui/core";
import { useMotionController } from "../runtime/motion-controller";
import type { MotionConfig } from "../runtime/types";

export function useStateMotion(present: boolean, config: MotionConfig, appear: boolean = true) {
  const [phase, setPhase] = React.useState<"entering" | "entered" | "exiting">(
    present ? (appear ? "entering" : "entered") : "exiting",
  );

  const lastPresent = React.useRef(present);
  if (present !== lastPresent.current) {
    lastPresent.current = present;
    setPhase(present ? "entering" : "exiting");
  }

  const markPhaseComplete = React.useCallback((completedPhase: string) => {
    setPhase((currentPhase) => {
      if (currentPhase === "entering" && completedPhase === "entering") return "entered";
      return currentPhase;
    });
  }, []);

  const ref = React.useRef<Instance>();
  useMotionController(ref, config, phase, markPhaseComplete as unknown);

  return ref;
}
