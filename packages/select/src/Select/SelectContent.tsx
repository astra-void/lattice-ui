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

function withVerticalOffset(position: UDim2, offset: number) {
  return new UDim2(position.X.Scale, position.X.Offset, position.Y.Scale, position.Y.Offset + offset);
}

function buildSelectContentTransition(position: UDim2): MotionTransition {
  return {
    enter: {
      tweenInfo: OPEN_TWEEN_INFO,
      from: {
        Position: withVerticalOffset(position, CONTENT_OPEN_Y_OFFSET),
      },
      to: {
        Position: position,
      },
    },
    exit: {
      tweenInfo: CLOSE_TWEEN_INFO,
      to: {
        Position: withVerticalOffset(position, CONTENT_OPEN_Y_OFFSET),
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
    return mergeMotionTransition(buildSelectContentTransition(popper.position), props.transition);
  }, [popper.position, props.transition]);

  useMotionTween(selectContext.contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[SelectContent] `asChild` requires a child element.");
      }

      return (
        <Slot AnchorPoint={popper.anchorPoint} Position={popper.position} Visible={props.visible} ref={setContentRef}>
          {child}
        </Slot>
      );
    })()
  ) : (
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
      {contentNode}
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

  if (!open && !forceMount) {
    return undefined;
  }

  const transition = props.transition;
  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

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
        transition={transition}
        visible={open}
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
          transition={transition}
          visible={true}
        >
          {props.children}
        </SelectContentImpl>
      )}
    />
  );
}
