import { React, Slot } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createPopperEntranceRecipe, usePresenceMotion } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import { usePopper } from "@lattice-ui/popper";
import { useMenuContext } from "./context";
import type { MenuContentProps } from "./types";

const CONTENT_OFFSET = 6;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }
  return instance;
}

function MenuContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: MenuContentProps["transition"];
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  forceMount?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const menuContext = useMenuContext();
  const open = menuContext.open;

  const popper = usePopper({
    anchorRef: menuContext.triggerRef,
    contentRef: menuContext.contentRef,
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
      menuContext.contentRef.current = toGuiObject(instance);
      if (motionRef) {
        motionRef.current = toGuiObject(instance);
      }
    },
    [menuContext.contentRef, motionRef],
  );

  const handleDismiss = React.useCallback(() => {
    menuContext.setOpen(false);
  }, [menuContext.setOpen]);

  const isActuallyVisible = open || (props.motionPresent && popper.isPositioned);

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[MenuContent] `asChild` requires a child element.");
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
      enabled={open}
      modal={menuContext.modal}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={open} restoreFocus={true} trapped={menuContext.modal}>
        <frame BackgroundTransparency={1} BorderSizePixel={0} Position={popper.position} Size={UDim2.fromOffset(0, 0)}>
          {contentNode}
        </frame>
      </FocusScope>
    </DismissableLayer>
  );
}

export function MenuContent(props: MenuContentProps) {
  const menuContext = useMenuContext();
  const open = menuContext.open;

  if (props.forceMount) {
    return (
      <MenuContentImpl
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
      </MenuContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <MenuContentImpl
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
        </MenuContentImpl>
      )}
    />
  );
}
