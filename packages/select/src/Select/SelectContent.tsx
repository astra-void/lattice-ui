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
import { useSelectContext } from "./context";
import type { SelectContentProps } from "./types";

const OPEN_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CLOSE_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OPEN_Y_OFFSET = 6;

type SelectContentImplProps = {
  enabled: boolean;
  present: boolean;
  visible: boolean;
  onDismiss: () => void;
  onExitComplete?: () => void;
  asChild?: boolean;
  transition?: MotionTransition | false;
  placement?: SelectContentProps["placement"];
  offset?: SelectContentProps["offset"];
  padding?: SelectContentProps["padding"];
} & Pick<SelectContentProps, "children" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function buildSelectContentTransition(): MotionTransition {
  return {
    enter: {
      tweenInfo: OPEN_TWEEN_INFO,
      from: {
        Position: UDim2.fromOffset(0, CONTENT_OPEN_Y_OFFSET),
      },
      to: {
        Position: UDim2.fromOffset(0, 0),
      },
    },
    exit: {
      tweenInfo: CLOSE_TWEEN_INFO,
      to: {
        Position: UDim2.fromOffset(0, CONTENT_OPEN_Y_OFFSET),
      },
    },
  };
}

function SelectContentImpl(props: SelectContentImplProps) {
  const selectContext = useSelectContext();

  const popper = usePopper({
    anchorRef: selectContext.triggerRef,
    contentRef: selectContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: props.enabled,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      selectContext.contentRef.current = toGuiObject(instance);
    },
    [selectContext.contentRef],
  );

  const motionTransition = React.useMemo(() => {
    return mergeMotionTransition(buildSelectContentTransition(), props.transition);
  }, [props.transition]);

  useMotionTween(selectContext.contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.present,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  const isActuallyVisible = popper.isPositioned;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[SelectContent] `asChild` requires a child element.");
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
      insideRefs={[selectContext.triggerRef]}
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

export function SelectContent(props: SelectContentProps) {
  const selectContext = useSelectContext();
  const open = selectContext.open;
  const forceMount = props.forceMount === true;

  const handleDismiss = React.useCallback(() => {
    selectContext.setOpen(false);
  }, [selectContext.setOpen]);

  const fallbackTransition = React.useMemo(() => {
    return mergeMotionTransition(buildSelectContentTransition(), props.transition);
  }, [props.transition]);
  const exitFallbackMs = getMotionTransitionExitFallbackMs(fallbackTransition);

  if (forceMount) {
    return (
      <SelectContentImpl
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
        visible={true}
      >
        {props.children}
      </SelectContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={open}
      render={(state) => (
        <SelectContentImpl
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
        </SelectContentImpl>
      )}
    />
  );
}
