import {
  getMotionTransitionExitFallbackMs,
  type MotionTransition,
  mergeMotionTransition,
  React,
  Slot,
  useMotionTween,
} from "@lattice-ui/core";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { usePopper } from "@lattice-ui/popper";
import { useTooltipContext } from "./context";
import type { TooltipContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 6;

type TooltipContentImplProps = {
  enabled: boolean;
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

function withVerticalOffset(position: UDim2, offset: number) {
  return new UDim2(position.X.Scale, position.X.Offset, position.Y.Scale, position.Y.Offset + offset);
}

function buildTooltipContentTransition(position: UDim2): MotionTransition {
  return {
    enter: {
      tweenInfo: CONTENT_TWEEN_INFO,
      from: {
        Position: withVerticalOffset(position, CONTENT_OFFSET),
      },
      to: {
        Position: position,
      },
    },
    exit: {
      tweenInfo: CONTENT_EXIT_TWEEN_INFO,
      to: {
        Position: withVerticalOffset(position, CONTENT_OFFSET),
      },
    },
  };
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
    return mergeMotionTransition(buildTooltipContentTransition(popper.position), props.transition);
  }, [popper.position, props.transition]);

  useMotionTween(tooltipContext.contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

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
        <Slot AnchorPoint={popper.anchorPoint} Position={popper.position} Visible={props.visible} ref={setContentRef}>
          {child}
        </Slot>
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
      <frame
        AnchorPoint={popper.anchorPoint}
        BackgroundTransparency={1}
        BorderSizePixel={0}
        Position={popper.position}
        Size={UDim2.fromOffset(0, 0)}
        Visible={props.visible}
        ref={setContentRef}
      >
        {props.children}
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

  if (!open && !forceMount) {
    return undefined;
  }

  const transition = props.transition;
  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

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
        transition={transition}
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
          transition={transition}
          visible={true}
        >
          {props.children}
        </TooltipContentImpl>
      )}
    />
  );
}
