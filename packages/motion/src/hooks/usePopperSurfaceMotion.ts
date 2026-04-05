import { React } from "@lattice-ui/core";
import { useMotionPresence } from "../runtime/motion-presence";
import { useMotionController } from "../runtime/motion-controller";
import { getPopperSurfaceRecipe } from "../recipes/popper-surface";

export function usePopperSurfaceMotion(
  present: boolean,
  placement: string,
  offsetDistance?: number,
  appear: boolean = true,
) {
  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<Instance>();
  const config = React.useMemo(() => getPopperSurfaceRecipe(placement, offsetDistance), [placement, offsetDistance]);

  useMotionController(ref, config, phase, markPhaseComplete);

  return { ref, isPresent };
}
