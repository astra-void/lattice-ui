import { React } from "@lattice-ui/core";
import { useMotionPresence } from "../runtime/motion-presence";
import { useMotionController } from "../runtime/motion-controller";
import { getToggleRecipe, getToggleOffsetRecipe } from "../recipes/toggle";

export function useToggleMotion(present: boolean, onColor: Color3, offColor: Color3, appear: boolean = true) {
  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<Instance>();
  const config = React.useMemo(() => getToggleRecipe(onColor, offColor), [onColor, offColor]);

  useMotionController(ref, config, phase, markPhaseComplete);

  return { ref, isPresent };
}

export function useToggleOffsetMotion(present: boolean, onPosition: UDim2, offPosition: UDim2, appear: boolean = true) {
  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present, appear });
  const ref = React.useRef<Instance>();
  const config = React.useMemo(() => getToggleOffsetRecipe(onPosition, offPosition), [onPosition, offPosition]);

  useMotionController(ref, config, phase, markPhaseComplete);

  return { ref, isPresent };
}
