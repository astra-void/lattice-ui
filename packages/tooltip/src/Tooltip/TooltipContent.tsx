import { React, Slot } from "@lattice-ui/core";
import { type MotionTransition } from "@lattice-ui/motion";
import { getMotionTransitionExitFallbackMs, mergeMotionTransition, useMotionTween } from "@lattice-ui/motion";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { buildPopperContentMotionTransition, usePopper } from "@lattice-ui/popper";
import { useTooltipContext } from "./context";
import type { TooltipContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 6;

type TooltipContentImplProps = {
  enabled: boolean;
  present: boolean;
  visible: boolean;
  onDismiss: () => void;
  onExitComplete?: () => void;
  asChild?: boolean;
  transition?: MotionTransition | false;
  placement?: TooltipContentProps["placement"];
  offset?: TooltipContentProps["offset"];
  padding?: TooltipContentProps["padding"];
} & Pick<TooltipContentProps, "children" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function buildTooltipContentTransition(): MotionTransition {
  return buildPopperContentMotionTransition("bottom", {
    distance: CONTENT_OFFSET,
    enterTweenInfo: CONTENT_TWEEN_INFO,
    exitTweenInfo: CONTENT_EXIT_TWEEN_INFO,
  });
}

function TooltipContentImpl(props: TooltipContentImplProps) {
  const tooltipContext = useTooltipContext();

  const popper = usePopper({
    anchorRef: tooltipContext.triggerRef,
    contentRef: tooltipContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: props.enabled,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      tooltipContext.contentRef.current = toGuiObject(instance);
    },
    [tooltipContext.contentRef],
  );

  const motionTransition = React.useMemo(() => {
    return mergeMotionTransition(
      buildPopperContentMotionTransition(popper.placement, {
        distance: CONTENT_OFFSET,
        enterTweenInfo: CONTENT_TWEEN_INFO,
        exitTweenInfo: CONTENT_EXIT_TWEEN_INFO,
      }),
      props.transition,
    );
  }, [popper.placement, props.transition]);

  useMotionTween(tooltipContext.contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.present,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  const isActuallyVisible = props.visible && popper.isPositioned;

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TooltipContent] `asChild` requires a child element.");
    }

    return (
      <DismissableLayer
        enabled={props.enabled}
        modal={false}
        onDismiss={props.onDismiss}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
      >
        <frame BackgroundTransparency={1} BorderSizePixel={0} Position={popper.position} Size={UDim2.fromOffset(0, 0)}>
          <Slot
            AnchorPoint={popper.anchorPoint}
            Position={UDim2.fromOffset(0, 0)}
            Visible={isActuallyVisible}
            ref={setContentRef}
          >
            {child}
          </Slot>
        </frame>
      </DismissableLayer>
    );
  }

  return (
    <DismissableLayer
      enabled={props.enabled}
      modal={false}
      onDismiss={props.onDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <frame BackgroundTransparency={1} BorderSizePixel={0} Position={popper.position} Size={UDim2.fromOffset(0, 0)}>
        <frame
          AnchorPoint={popper.anchorPoint}
          AutomaticSize={Enum.AutomaticSize.XY}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(0, 0)}
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
  const forceMount = props.forceMount === true;

  const handleDismiss = React.useCallback(() => {
    tooltipContext.close();
  }, [tooltipContext]);

  const fallbackTransition = React.useMemo(() => {
    return mergeMotionTransition(buildTooltipContentTransition(), props.transition);
  }, [props.transition]);
  const exitFallbackMs = getMotionTransitionExitFallbackMs(fallbackTransition);

  if (forceMount) {
    return (
      <TooltipContentImpl
        asChild={props.asChild}
        enabled={open}
        offset={props.offset}
        onDismiss={handleDismiss}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        padding={props.padding}
        placement={props.placement}
        transition={props.transition}
        present={open}
        visible={open}
      >
        {props.children}
      </TooltipContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={open}
      render={(state) => (
        <TooltipContentImpl
          asChild={props.asChild}
          enabled={state.isPresent}
          offset={props.offset}
          onDismiss={handleDismiss}
          onExitComplete={state.onExitComplete}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          padding={props.padding}
          placement={props.placement}
          transition={props.transition}
          present={state.isPresent}
          visible={true}
        >
          {props.children}
        </TooltipContentImpl>
      )}
    />
  );
}
