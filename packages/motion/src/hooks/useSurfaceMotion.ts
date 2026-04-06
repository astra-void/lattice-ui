import { React } from "@lattice-ui/core";
import { getSurfaceRecipe } from "../recipes/surface";
import { useMotionController } from "../runtime/motion-controller";
import { useMotionPresence } from "../runtime/motion-presence";

export function useSurfaceMotion(present: boolean, appear: boolean = true) {
  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<Instance>();
  const config = React.useMemo(() => getSurfaceRecipe(), []);

  useMotionController(ref, config, phase, markPhaseComplete);

  return { ref, isPresent };
}
