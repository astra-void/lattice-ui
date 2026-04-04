import { React, Slot } from "@lattice-ui/core";
import { type MotionTransition } from "@lattice-ui/motion";
import { getMotionTransitionExitFallbackMs, mergeMotionTransition, useMotionTween } from "@lattice-ui/motion";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { buildPopperContentMotionTransition, usePopper } from "@lattice-ui/popper";
import { useComboboxContext } from "./context";
import type { ComboboxContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 6;

type ComboboxContentImplProps = {
  enabled: boolean;
  visible: boolean;
  onDismiss: () => void;
  onExitComplete?: () => void;
  asChild?: boolean;
  transition?: MotionTransition | false;
  placement?: ComboboxContentProps["placement"];
  offset?: ComboboxContentProps["offset"];
  padding?: ComboboxContentProps["padding"];
} & Pick<ComboboxContentProps, "children" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function buildComboboxContentTransition(): MotionTransition {
  return buildPopperContentMotionTransition("bottom", {
    distance: CONTENT_OFFSET,
    enterTweenInfo: CONTENT_TWEEN_INFO,
    exitTweenInfo: CONTENT_EXIT_TWEEN_INFO,
  });
}

function ComboboxContentImpl(props: ComboboxContentImplProps) {
  const comboboxContext = useComboboxContext();

  const popper = usePopper({
    anchorRef: comboboxContext.anchorRef,
    contentRef: comboboxContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: props.enabled,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      comboboxContext.contentRef.current = toGuiObject(instance);
    },
    [comboboxContext.contentRef],
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

  useMotionTween(comboboxContext.contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  const isActuallyVisible = props.visible && popper.isPositioned;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[ComboboxContent] `asChild` requires a child element.");
      }

      return (
        <Slot
          AnchorPoint={popper.anchorPoint}
          Position={UDim2.fromOffset(0, 0)}
          Visible={isActuallyVisible}
          ref={setContentRef}
        >
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
      Position={UDim2.fromOffset(0, 0)}
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
      insideRefs={[comboboxContext.triggerRef, comboboxContext.inputRef]}
      modal={false}
      onDismiss={props.onDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <frame BackgroundTransparency={1} BorderSizePixel={0} Position={popper.position} Size={UDim2.fromOffset(0, 0)}>
        {contentNode}
      </frame>
    </DismissableLayer>
  );
}

export function ComboboxContent(props: ComboboxContentProps) {
  const comboboxContext = useComboboxContext();
  const open = comboboxContext.open;
  const forceMount = props.forceMount === true;

  const handleDismiss = React.useCallback(() => {
    comboboxContext.setOpen(false);
  }, [comboboxContext]);

  const fallbackTransition = React.useMemo(() => {
    return mergeMotionTransition(buildComboboxContentTransition(), props.transition);
  }, [props.transition]);
  const exitFallbackMs = getMotionTransitionExitFallbackMs(fallbackTransition);

  if (forceMount) {
    return (
      <ComboboxContentImpl
        asChild={props.asChild}
        enabled={open}
        offset={props.offset}
        onDismiss={handleDismiss}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        padding={props.padding}
        placement={props.placement}
        transition={props.transition}
        visible={open}
      >
        {props.children}
      </ComboboxContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={open}
      render={(state) => (
        <ComboboxContentImpl
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
          visible={true}
        >
          {props.children}
        </ComboboxContentImpl>
      )}
    />
  );
}
