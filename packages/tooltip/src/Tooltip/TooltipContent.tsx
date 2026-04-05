import { React, Slot } from "@lattice-ui/core";
import { usePopperSurfaceMotion } from "@lattice-ui/motion";
import { DismissableLayer } from "@lattice-ui/layer";
import { usePopper } from "@lattice-ui/popper";
import { useTooltipContext } from "./context";
import type { TooltipContentProps } from "./types";

const CONTENT_OFFSET = 6;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }
  return instance;
}

export function TooltipContent(props: TooltipContentProps) {
  const tooltipContext = useTooltipContext();
  const open = tooltipContext.open;
  const forceMount = props.forceMount === true;

  const popper = usePopper({
    anchorRef: tooltipContext.triggerRef,
    contentRef: tooltipContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: open,
  });

  const { ref: motionRef, isPresent } = usePopperSurfaceMotion(
    open && popper.isPositioned,
    popper.placement,
    CONTENT_OFFSET,
    true,
  );

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      tooltipContext.contentRef.current = toGuiObject(instance);
      if (motionRef) {
        motionRef.current = instance;
      }
    },
    [tooltipContext.contentRef, motionRef],
  );

  const handleDismiss = React.useCallback(() => {
    tooltipContext.close();
  }, [tooltipContext]);

  if (!isPresent && !forceMount) {
    return undefined;
  }

  const isActuallyVisible = popper.isPositioned;

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TooltipContent] `sChild` requires a child element.");
    }

    return (
      <DismissableLayer
        enabled={open}
        modal={false}
        onDismiss={handleDismiss}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
      >
        <frame BackgroundTransparency={1} BorderSizePixel={0} Position={popper.position} Size={UDim2.fromOffset(0, 0)}>
          <Slot AnchorPoint={popper.anchorPoint} Visible={isActuallyVisible} ref={setContentRef}>
            {child}
          </Slot>
        </frame>
      </DismissableLayer>
    );
  }

  return (
    <DismissableLayer
      enabled={open}
      modal={false}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <frame BackgroundTransparency={1} BorderSizePixel={0} Position={popper.position} Size={UDim2.fromOffset(0, 0)}>
        <frame
          AnchorPoint={popper.anchorPoint}
          AutomaticSize={Enum.AutomaticSize.XY}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Size={UDim2.fromOffset(0, 0)}
          Visible={isActuallyVisible}
          ref={setContentRef}
        >
          {props.children}
        </frame>
      </frame>
    </DismissableLayer>
  );
}
