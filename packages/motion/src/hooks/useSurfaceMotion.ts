import { React } from "@lattice-ui/core";
import { useMotionPresence } from "../runtime/motion-presence";
import { useMotionController } from "../runtime/motion-controller";
import { getSurfaceRecipe } from "../recipes/surface";

export function useSurfaceMotion(present: boolean, appear: boolean = true) {
  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<Instance>();
  const config = React.useMemo(() => getSurfaceRecipe(), []);

  useMotionController(ref, config, phase, markPhaseComplete);

  return { ref, isPresent };
}
