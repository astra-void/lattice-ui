import { React } from "@lattice-ui/core";
import { getOverlayRecipe } from "../recipes/overlay";
import { useMotionController } from "../runtime/motion-controller";
import { useMotionPresence } from "../runtime/motion-presence";

export function useOverlayMotion(present: boolean, appear: boolean = true) {
  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<Instance>();
  const config = React.useMemo(() => getOverlayRecipe(), []);

  useMotionController(ref, config, phase, markPhaseComplete);

  return { ref, isPresent };
}
