import { React, Slot } from "@lattice-ui/core";
import { RovingFocusGroup } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { usePopper } from "@lattice-ui/popper";
import { useMenuContext } from "./context";
import type { MenuContentProps } from "./types";

type MenuContentImplProps = {
  enabled: boolean;
  visible: boolean;
  onDismiss: () => void;
  loop: boolean;
  keyboardNavigation: boolean;
  asChild?: boolean;
  placement?: MenuContentProps["placement"];
  offset?: MenuContentProps["offset"];
  padding?: MenuContentProps["padding"];
} & Pick<MenuContentProps, "children" | "onEscapeKeyDown" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
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
      onEscapeKeyDown={props.onEscapeKeyDown}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <RovingFocusGroup active={props.enabled && props.keyboardNavigation} autoFocus="first" loop={props.loop} orientation="vertical">
        {contentNode}
      </RovingFocusGroup>
    </DismissableLayer>
  );
}

export function MenuContent(props: MenuContentProps) {
  const menuContext = useMenuContext();
  const open = menuContext.open;
  const forceMount = props.forceMount === true;
  const loop = props.loop ?? true;

  const handleDismiss = React.useCallback(() => {
    menuContext.setOpen(false);
  }, [menuContext.setOpen]);

  if (!open && !forceMount) {
    return undefined;
  }

  if (forceMount) {
    return (
      <MenuContentImpl
        asChild={props.asChild}
        enabled={open}
        loop={loop}
        keyboardNavigation={menuContext.keyboardNavigation}
        offset={props.offset}
        onDismiss={handleDismiss}
        onEscapeKeyDown={props.onEscapeKeyDown}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        padding={props.padding}
        placement={props.placement}
        visible={open}
      >
        {props.children}
      </MenuContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={0}
      present={open}
      render={(state) => (
        <MenuContentImpl
          asChild={props.asChild}
          enabled={state.isPresent}
          loop={loop}
          keyboardNavigation={menuContext.keyboardNavigation}
          offset={props.offset}
          onDismiss={handleDismiss}
          onEscapeKeyDown={props.onEscapeKeyDown}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          padding={props.padding}
          placement={props.placement}
          visible={state.isPresent}
        >
          {props.children}
        </MenuContentImpl>
      )}
    />
  );
}
