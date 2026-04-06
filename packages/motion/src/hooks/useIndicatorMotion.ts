import { React } from "@lattice-ui/core";
import { getIndicatorRecipe } from "../recipes/indicator";
import { useMotionController } from "../runtime/motion-controller";
import { useMotionPresence } from "../runtime/motion-presence";

export function useIndicatorMotion(present: boolean, appear: boolean = true) {
  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<Instance>();
  const config = React.useMemo(() => getIndicatorRecipe(), []);

  useMotionController(ref, config, phase, markPhaseComplete);

  return { ref, isPresent };
}
