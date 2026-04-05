import { React } from "@lattice-ui/core";
import { useMotionPresence } from "../runtime/motion-presence";
import { useMotionController } from "../runtime/motion-controller";
import { getIndicatorRecipe } from "../recipes/indicator";

export function useIndicatorMotion(present: boolean, appear: boolean = true) {
  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<Instance>();
  const config = React.useMemo(() => getIndicatorRecipe(), []);

  useMotionController(ref, config, phase, markPhaseComplete);

  return { ref, isPresent };
}
