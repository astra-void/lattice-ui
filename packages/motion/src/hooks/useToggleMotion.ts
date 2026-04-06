import { React } from "@lattice-ui/core";
import { getToggleOffsetRecipe, getToggleRecipe } from "../recipes/toggle";
import { useMotionController } from "../runtime/motion-controller";
import { useMotionPresence } from "../runtime/motion-presence";

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
