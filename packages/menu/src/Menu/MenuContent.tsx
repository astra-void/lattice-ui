import {
  getMotionTransitionExitFallbackMs,
  type MotionTransition,
  mergeMotionTransition,
  React,
  Slot,
  useMotionTween,
} from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { usePopper } from "@lattice-ui/popper";
import { useMenuContext } from "./context";
import type { MenuContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 6;

type MenuContentImplProps = {
  enabled: boolean;
  visible: boolean;
  onDismiss: () => void;
  onExitComplete?: () => void;
  asChild?: boolean;
  transition?: MotionTransition | false;
  placement?: MenuContentProps["placement"];
  offset?: MenuContentProps["offset"];
  padding?: MenuContentProps["padding"];
} & Pick<MenuContentProps, "children" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function withVerticalOffset(position: UDim2, offset: number) {
  return new UDim2(position.X.Scale, position.X.Offset, position.Y.Scale, position.Y.Offset + offset);
}

function buildMenuContentTransition(position: UDim2): MotionTransition {
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

function MenuContentImpl(props: MenuContentImplProps) {
  const menuContext = useMenuContext();

  const popper = usePopper({
    anchorRef: menuContext.triggerRef,
    contentRef: menuContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: props.enabled,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      menuContext.contentRef.current = toGuiObject(instance);
    },
    [menuContext.contentRef],
  );

  const motionTransition = React.useMemo(() => {
    return mergeMotionTransition(buildMenuContentTransition(popper.position), props.transition);
  }, [popper.position, props.transition]);

  useMotionTween(menuContext.contentRef as React.MutableRefObject<Instance | undefined>, {
    active: props.visible,
    onExitComplete: props.onExitComplete,
    transition: motionTransition,
  });

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[MenuContent] `asChild` requires a child element.");
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
      modal={menuContext.modal}
      onDismiss={props.onDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={props.enabled} restoreFocus={true} trapped={menuContext.modal}>
        {contentNode}
      </FocusScope>
    </DismissableLayer>
  );
}

export function MenuContent(props: MenuContentProps) {
  const menuContext = useMenuContext();
  const open = menuContext.open;
  const forceMount = props.forceMount === true;

  const handleDismiss = React.useCallback(() => {
    menuContext.setOpen(false);
  }, [menuContext.setOpen]);

  if (!open && !forceMount) {
    return undefined;
  }

  const transition = props.transition;
  const exitFallbackMs = getMotionTransitionExitFallbackMs(transition);

  if (forceMount) {
    return (
      <MenuContentImpl
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
      </MenuContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={open}
      render={(state) => (
        <MenuContentImpl
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
        </MenuContentImpl>
      )}
    />
  );
}
