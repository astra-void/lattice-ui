import { React, Slot } from "@lattice-ui/core";
import { DismissableLayer } from "@lattice-ui/layer";
import { usePopperSurfaceMotion } from "@lattice-ui/motion";
import { usePopper } from "@lattice-ui/popper";
import { useComboboxContext } from "./context";
import type { ComboboxContentProps } from "./types";

const CONTENT_OFFSET = 6;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }
  return instance;
}

export function ComboboxContent(props: ComboboxContentProps) {
  const comboboxContext = useComboboxContext();
  const open = comboboxContext.open;
  const forceMount = props.forceMount === true;

  const popper = usePopper({
    anchorRef: comboboxContext.anchorRef,
    contentRef: comboboxContext.contentRef,
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
      comboboxContext.contentRef.current = toGuiObject(instance);
      if (motionRef) {
        motionRef.current = instance;
      }
    },
    [comboboxContext.contentRef, motionRef],
  );

  const handleDismiss = React.useCallback(() => {
    comboboxContext.setOpen(false);
  }, [comboboxContext]);

  if (!isPresent && !forceMount) {
    return undefined;
  }

  const isActuallyVisible = popper.isPositioned;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[ComboboxContent] `asChild` requires a child element.");
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
      insideRefs={[comboboxContext.triggerRef, comboboxContext.inputRef]}
      modal={false}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <frame
        BackgroundTransparency={1}
        BorderSizePixel={0}
        Position={popper.isPositioned ? popper.position : UDim2.fromOffset(-9999, -9999)}
        Size={UDim2.fromOffset(0, 0)}
      >
        {contentNode}
      </frame>
    </DismissableLayer>
  );
}
