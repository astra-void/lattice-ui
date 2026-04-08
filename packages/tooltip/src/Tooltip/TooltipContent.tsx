import { React, Slot } from "@lattice-ui/core";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createPopperEntranceRecipe, usePresenceMotion } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
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

function TooltipContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: TooltipContentProps["transition"];
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  forceMount?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const tooltipContext = useTooltipContext();
  const open = tooltipContext.open;

  const popper = usePopper({
    anchorRef: tooltipContext.triggerRef,
    contentRef: tooltipContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: open,
  });

  const defaultTransition = React.useMemo(
    () => createPopperEntranceRecipe(popper.placement, CONTENT_OFFSET),
    [popper.placement],
  );
  const recipe = props.transition ?? defaultTransition;

  const motionRef = usePresenceMotion<GuiObject>(
    props.motionPresent && popper.isPositioned,
    recipe,
    props.onExitComplete,
  );

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      tooltipContext.contentRef.current = toGuiObject(instance);
      if (motionRef) {
        motionRef.current = toGuiObject(instance);
      }
    },
    [tooltipContext.contentRef, motionRef],
  );

  const handleDismiss = React.useCallback(() => {
    tooltipContext.close();
  }, [tooltipContext]);

  const isActuallyVisible = popper.isPositioned;

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TooltipContent] `asChild` requires a child element.");
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

export function TooltipContent(props: TooltipContentProps) {
  const tooltipContext = useTooltipContext();
  const open = tooltipContext.open;

  if (props.forceMount) {
    return (
      <TooltipContentImpl
        motionPresent={open}
        transition={props.transition}
        placement={props.placement}
        offset={props.offset}
        padding={props.padding}
        forceMount={props.forceMount}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        asChild={props.asChild}
      >
        {props.children}
      </TooltipContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <TooltipContentImpl
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={props.transition}
          placement={props.placement}
          offset={props.offset}
          padding={props.padding}
          forceMount={props.forceMount}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          asChild={props.asChild}
        >
          {props.children}
        </TooltipContentImpl>
      )}
    />
  );
}
