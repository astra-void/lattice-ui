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

function withVerticalOffset(position: UDim2, offset: number) {
  return new UDim2(position.X.Scale, position.X.Offset, position.Y.Scale, position.Y.Offset + offset);
}

function buildComboboxContentTransition(position: UDim2): MotionTransition {
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
    return mergeMotionTransition(buildComboboxContentTransition(popper.position), props.transition);
  }, [popper.position, props.transition]);

  useMotionTween(comboboxContext.contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[ComboboxContent] `asChild` requires a child element.");
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
      AutomaticSize={Enum.AutomaticSize.XY}
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
      insideRefs={[comboboxContext.triggerRef, comboboxContext.inputRef]}
      modal={false}
      onDismiss={props.onDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      {contentNode}
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
    return mergeMotionTransition(buildComboboxContentTransition(UDim2.fromOffset(0, 0)), props.transition);
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
