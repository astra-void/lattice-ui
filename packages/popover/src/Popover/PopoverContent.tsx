import { React, Slot } from "@lattice-ui/core";
import { type MotionTransition } from "@lattice-ui/motion";
import { getMotionTransitionExitFallbackMs, mergeMotionTransition, useMotionTween } from "@lattice-ui/motion";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { buildPopperContentMotionTransition, usePopper } from "@lattice-ui/popper";
import { usePopoverContext } from "./context";
import type { PopoverContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 6;

type PopoverContentImplProps = {
  enabled: boolean;
  present: boolean;
  visible: boolean;
  onDismiss: () => void;
  onExitComplete?: () => void;
  asChild?: boolean;
  transition?: MotionTransition | false;
  placement?: PopoverContentProps["placement"];
  offset?: PopoverContentProps["offset"];
  padding?: PopoverContentProps["padding"];
} & Pick<PopoverContentProps, "children" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function buildPopoverContentTransition(): MotionTransition {
  return buildPopperContentMotionTransition("bottom", {
    distance: CONTENT_OFFSET,
    enterTweenInfo: CONTENT_TWEEN_INFO,
    exitTweenInfo: CONTENT_EXIT_TWEEN_INFO,
  });
}

function PopoverContentImpl(props: PopoverContentImplProps) {
  const popoverContext = usePopoverContext();
  const anchorRef = popoverContext.anchorRef.current ? popoverContext.anchorRef : popoverContext.triggerRef;

  const popper = usePopper({
    anchorRef,
    contentRef: popoverContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: props.enabled,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      popoverContext.contentRef.current = toGuiObject(instance);
    },
    [popoverContext.contentRef],
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

  useMotionTween(popoverContext.contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.present && popper.isPositioned,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  // Wait until popper has at least one valid measurement to avoid a frame at (0, 0)
  const isActuallyVisible = props.visible;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[PopoverContent] `asChild` requires a child element.");
      }

      return (
        <Slot AnchorPoint={popper.anchorPoint} Visible={isActuallyVisible} ref={setContentRef}>
          {child}
        </Slot>
      );
    })()
  ) : (
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
  );

  return (
    <DismissableLayer
      enabled={props.enabled}
      modal={popoverContext.modal}
      onDismiss={props.onDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={props.enabled} restoreFocus={true} trapped={popoverContext.modal}>
        <frame
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Position={popper.isPositioned ? popper.position : UDim2.fromOffset(-9999, -9999)}
          Size={UDim2.fromOffset(0, 0)}
        >
          {contentNode}
        </frame>
      </FocusScope>
    </DismissableLayer>
  );
}

export function PopoverContent(props: PopoverContentProps) {
  const popoverContext = usePopoverContext();
  const open = popoverContext.open;
  const forceMount = props.forceMount === true;

  const handleDismiss = React.useCallback(() => {
    popoverContext.setOpen(false);
  }, [popoverContext.setOpen]);

  const fallbackTransition = React.useMemo(() => {
    return mergeMotionTransition(buildPopoverContentTransition(), props.transition);
  }, [props.transition]);
  const exitFallbackMs = getMotionTransitionExitFallbackMs(fallbackTransition);

  if (forceMount) {
    return (
      <PopoverContentImpl
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
      </PopoverContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={open}
      render={(state) => (
        <PopoverContentImpl
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
        </PopoverContentImpl>
      )}
    />
  );
}
