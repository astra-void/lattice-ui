import { React, Slot } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer } from "@lattice-ui/layer";
import { getSurfaceRecipe, type MotionConfig, useMotionController, useMotionPresence } from "@lattice-ui/motion";
import { useDialogContext } from "./context";
import type { DialogContentProps } from "./types";

function mergeMotionConfig(baseConfig: MotionConfig, overrideConfig?: MotionConfig): MotionConfig {
  if (!overrideConfig) {
    return baseConfig;
  }

  return {
    entering: { ...baseConfig.entering, ...overrideConfig.entering },
    entered: { ...baseConfig.entered, ...overrideConfig.entered },
    exiting: { ...baseConfig.exiting, ...overrideConfig.exiting },
  };
}

export function DialogContent(props: DialogContentProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;
  const trapFocus = props.trapFocus ?? true;
  const restoreFocus = props.restoreFocus ?? true;

  const { phase, isPresent, markPhaseComplete } = useMotionPresence({ present: open, appear: true });
  const motionRef = React.useRef<Instance>();
  const motionConfig = React.useMemo(() => {
    return mergeMotionConfig(getSurfaceRecipe(), props.transition);
  }, [props.transition]);

  useMotionController(motionRef, motionConfig, phase, markPhaseComplete);

  const handleDismiss = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  if (!isPresent && !props.forceMount) {
    return undefined;
  }

  return (
    <DismissableLayer
      enabled={open}
      modal={dialogContext.modal}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={open} restoreFocus={restoreFocus} trapped={trapFocus}>
        <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)} ZIndex={10}>
          <Slot ref={motionRef as React.MutableRefObject<Instance>}>{props.children}</Slot>
        </frame>
      </FocusScope>
    </DismissableLayer>
  );
}
