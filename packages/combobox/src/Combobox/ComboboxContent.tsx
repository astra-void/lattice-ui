import { composeRefs, getElementRef, React } from "@lattice-ui/core";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createCanvasGroupPopperEntranceRecipe, usePresenceMotionController } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import { usePopper } from "@lattice-ui/popper";
import { useComboboxContext } from "./context";
import type { ComboboxContentProps } from "./types";

const CONTENT_OFFSET = 6;
const HIDDEN_POSITION = UDim2.fromOffset(-9999, -9999);

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

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
  const shouldMeasure = open || props.motionPresent || props.onExitComplete !== undefined;

  const popper = usePopper({
    anchorRef: comboboxContext.anchorRef,
    contentRef: comboboxContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: shouldMeasure,
  });

  const defaultTransition = React.useMemo(
    () => createCanvasGroupPopperEntranceRecipe(popper.placement, CONTENT_OFFSET),
    [popper.placement],
  );
  const recipe = props.transition ?? defaultTransition;

  const motion = usePresenceMotionController<GuiObject>({
    present: props.motionPresent,
    ready: popper.isPositioned,
    forceMount: props.forceMount,
    config: recipe,
    onExitComplete: props.onExitComplete,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      const guiObject = toGuiObject(instance);
      comboboxContext.contentRef.current = guiObject;
      motion.ref.current = guiObject;
    },
    [comboboxContext.contentRef, motion.ref],
  );

  const handleDismiss = React.useCallback(() => {
    comboboxContext.setOpen(false);
  }, [comboboxContext]);

  const shouldRender = motion.mounted;
  const contentVisible = shouldRender && (motion.present || motion.phase !== "exited");
  const popperPosition = popper.isPositioned ? popper.position : HIDDEN_POSITION;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[ComboboxContent] `asChild` requires a child element.");
      }

      const childProps = toGuiPropBag((child as { props?: unknown }).props);
      const childRef = getElementRef<Instance>(child);

      return (
        <canvasgroup
          AutomaticSize={Enum.AutomaticSize.XY}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Size={UDim2.fromOffset(0, 0)}
          Visible={contentVisible}
          ref={setContentRef as React.Ref<CanvasGroup>}
        >
          {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
            ...childProps,
            Position: UDim2.fromOffset(0, 0),
            Visible: contentVisible,
            ref: composeRefs(childRef),
          })}
        </canvasgroup>
      );
    })()
  ) : (
    <canvasgroup
      AutomaticSize={Enum.AutomaticSize.XY}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(0, 0)}
      Visible={contentVisible}
      ref={setContentRef}
    >
      {props.children}
    </canvasgroup>
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
        AnchorPoint={popper.anchorPoint}
        BackgroundTransparency={1}
        BorderSizePixel={0}
        Position={popperPosition}
        Size={UDim2.fromOffset(0, 0)}
        Visible={shouldRender}
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
