import { React, Slot } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer } from "@lattice-ui/layer";
import { usePopperSurfaceMotion } from "@lattice-ui/motion";
import { usePopper } from "@lattice-ui/popper";
import { usePopoverContext } from "./context";
import type { PopoverContentProps } from "./types";

const CONTENT_OFFSET = 6;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }
  return instance;
}

export function PopoverContent(props: PopoverContentProps) {
  const popoverContext = usePopoverContext();
  const open = popoverContext.open;
  const forceMount = props.forceMount === true;

  const anchorRef = popoverContext.anchorRef.current ? popoverContext.anchorRef : popoverContext.triggerRef;

  const popper = usePopper({
    anchorRef,
    contentRef: popoverContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: open,
  });

  const { ref: motionRef, isPresent } = usePopperSurfaceMotion(
    open && popper.isPositioned,
    popper.placement,
    CONTENT_OFFSET,
    true,
  );

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      popoverContext.contentRef.current = toGuiObject(instance);
      if (motionRef) {
        motionRef.current = instance;
      }
    },
    [popoverContext.contentRef, motionRef],
  );

  const handleDismiss = React.useCallback(() => {
    popoverContext.setOpen(false);
  }, [popoverContext.setOpen]);

  if (!isPresent && !forceMount) {
    return undefined;
  }

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[PopoverContent] `asChild` requires a child element.");
      }

      return (
        <Slot AnchorPoint={popper.anchorPoint} ref={setContentRef}>
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
      ref={setContentRef}
    >
      {props.children}
    </frame>
  );

  return (
    <DismissableLayer
      enabled={open}
      modal={popoverContext.modal}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={open} restoreFocus={true} trapped={popoverContext.modal}>
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
