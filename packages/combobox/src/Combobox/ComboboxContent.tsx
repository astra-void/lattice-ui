import { React, Slot } from "@lattice-ui/core";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createPopperEntranceRecipe, usePresenceMotion } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
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

function ComboboxContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  forceMount?: boolean;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  transition?: ComboboxContentProps["transition"];
  children?: React.ReactNode;
}) {
  const comboboxContext = useComboboxContext();
  const open = comboboxContext.open;

  const popper = usePopper({
    anchorRef: comboboxContext.anchorRef,
    contentRef: comboboxContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: open,
  });

  const defaultTransition = React.useMemo(
    () => createPopperEntranceRecipe(popper.placement, CONTENT_OFFSET),
    [popper.placement],
  );
  const motionRef = usePresenceMotion<GuiObject>(
    props.motionPresent && popper.isPositioned,
    props.transition ?? defaultTransition,
    props.onExitComplete,
  );

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      comboboxContext.contentRef.current = toGuiObject(instance);
      motionRef.current = toGuiObject(instance);
    },
    [comboboxContext.contentRef, motionRef],
  );

  const handleDismiss = React.useCallback(() => {
    comboboxContext.setOpen(false);
  }, [comboboxContext]);
  const isActuallyVisible = open || (props.motionPresent && popper.isPositioned);

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

export function ComboboxContent(props: ComboboxContentProps) {
  const comboboxContext = useComboboxContext();
  const open = comboboxContext.open;

  if (props.forceMount) {
    return (
      <ComboboxContentImpl
        asChild={props.asChild}
        forceMount={props.forceMount}
        motionPresent={open}
        offset={props.offset}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        padding={props.padding}
        placement={props.placement}
        transition={props.transition}
      >
        {props.children}
      </ComboboxContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <ComboboxContentImpl
          asChild={props.asChild}
          forceMount={props.forceMount}
          motionPresent={state.isPresent}
          offset={props.offset}
          onExitComplete={state.onExitComplete}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          padding={props.padding}
          placement={props.placement}
          transition={props.transition}
        >
          {props.children}
        </ComboboxContentImpl>
      )}
    />
  );
}
