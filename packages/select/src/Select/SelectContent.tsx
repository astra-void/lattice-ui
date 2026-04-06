import { React, Slot } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { DismissableLayer } from "@lattice-ui/layer";
import { usePopperSurfaceMotion } from "@lattice-ui/motion";
import { usePopper } from "@lattice-ui/popper";
import { useSelectContext } from "./context";
import type { SelectContentProps } from "./types";

const CONTENT_OFFSET = 6;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }
  return instance;
}

export function SelectContent(props: SelectContentProps) {
  const selectContext = useSelectContext();
  const open = selectContext.open;
  const forceMount = props.forceMount === true;

  const popper = usePopper({
    anchorRef: selectContext.triggerRef,
    contentRef: selectContext.contentRef,
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
      selectContext.contentRef.current = toGuiObject(instance);
      if (motionRef) {
        motionRef.current = instance;
      }
    },
    [selectContext.contentRef, motionRef],
  );

  const handleDismiss = React.useCallback(() => {
    selectContext.setOpen(false);
  }, [selectContext.setOpen]);

  if (!isPresent && !forceMount) {
    return undefined;
  }

  const isActuallyVisible = popper.isPositioned;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[SelectContent] `asChild` requires a child element.");
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
      modal={false}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <FocusScope active={open} restoreFocus={true} trapped={false}>
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
