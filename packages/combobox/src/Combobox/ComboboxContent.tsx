import { React, Slot } from "@lattice-ui/core";
import { RovingFocusGroup } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { usePopper } from "@lattice-ui/popper";
import { useComboboxContext } from "./context";
import type { ComboboxContentProps } from "./types";

type ComboboxContentImplProps = {
  enabled: boolean;
  visible: boolean;
  onDismiss: () => void;
  asChild?: boolean;
  placement?: ComboboxContentProps["placement"];
  offset?: ComboboxContentProps["offset"];
  padding?: ComboboxContentProps["padding"];
} & Pick<ComboboxContentProps, "children" | "onEscapeKeyDown" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function ComboboxContentImpl(props: ComboboxContentImplProps) {
  const comboboxContext = useComboboxContext();
  const keyboardNavigation = comboboxContext.keyboardNavigation;

  const popper = usePopper({
    anchorRef: comboboxContext.triggerRef,
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
      modal={false}
      onDismiss={props.onDismiss}
      onEscapeKeyDown={props.onEscapeKeyDown}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <RovingFocusGroup active={props.enabled && keyboardNavigation} autoFocus="first" loop={comboboxContext.loop} orientation="vertical">
        {contentNode}
      </RovingFocusGroup>
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

  if (!open && !forceMount) {
    return undefined;
  }

  if (forceMount) {
    return (
      <ComboboxContentImpl
        asChild={props.asChild}
        enabled={open}
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
      </ComboboxContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={0}
      present={open}
      render={(state) => (
        <ComboboxContentImpl
          asChild={props.asChild}
          enabled={state.isPresent}
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
        </ComboboxContentImpl>
      )}
    />
  );
}

