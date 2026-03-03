import { React, Slot } from "@lattice-ui/core";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { usePopper } from "@lattice-ui/popper";
import { usePopoverContext } from "./context";
import type { PopoverContentProps } from "./types";

type PopoverContentImplProps = {
  enabled: boolean;
  visible: boolean;
  onDismiss: () => void;
  asChild?: boolean;
  placement?: PopoverContentProps["placement"];
  offset?: PopoverContentProps["offset"];
  padding?: PopoverContentProps["padding"];
} & Pick<PopoverContentProps, "children" | "onEscapeKeyDown" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
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

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[PopoverContent] `asChild` requires a child element.");
    }

    return (
      <DismissableLayer
        enabled={props.enabled}
        modal={popoverContext.modal}
        onDismiss={props.onDismiss}
        onEscapeKeyDown={props.onEscapeKeyDown}
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
      modal={popoverContext.modal}
      onDismiss={props.onDismiss}
      onEscapeKeyDown={props.onEscapeKeyDown}
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

export function PopoverContent(props: PopoverContentProps) {
  const popoverContext = usePopoverContext();
  const open = popoverContext.open;
  const forceMount = props.forceMount === true;

  const handleDismiss = React.useCallback(() => {
    popoverContext.setOpen(false);
  }, [popoverContext.setOpen]);

  if (!open && !forceMount) {
    return undefined;
  }

  if (forceMount) {
    return (
      <PopoverContentImpl
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
      </PopoverContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={0}
      present={open}
      render={(state) => (
        <PopoverContentImpl
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
        </PopoverContentImpl>
      )}
    />
  );
}
