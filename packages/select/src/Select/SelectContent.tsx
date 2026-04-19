import { composeRefs, getElementRef, React } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createCanvasGroupPopperEntranceRecipe, createPopperEntranceRecipe, usePresenceMotionController } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import { usePopper } from "@lattice-ui/popper";
import { useSelectContext } from "./context";
import type { SelectContentProps } from "./types";

const CONTENT_OFFSET = 10;
const HIDDEN_POSITION = UDim2.fromOffset(-9999, -9999);

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }
  return instance;
}

function SelectContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: SelectContentProps["transition"];
  placement?: PopperPlacement;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  forceMount?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const selectContext = useSelectContext();
  const open = selectContext.open;
  const shouldMeasure = open || props.motionPresent || props.onExitComplete !== undefined;
  const contentBoundaryRef = React.useRef<GuiObject>();

  const popper = usePopper({
    anchorRef: selectContext.triggerRef,
    contentRef: selectContext.contentRef,
    alignOffset: props.alignOffset,
    collisionPadding: props.collisionPadding,
    sideOffset: props.sideOffset,
    placement: props.placement,
    enabled: shouldMeasure,
  });

  const defaultTransition = React.useMemo(
    () =>
      props.asChild
        ? createPopperEntranceRecipe(popper.placement, CONTENT_OFFSET, 0.16)
        : createCanvasGroupPopperEntranceRecipe(popper.placement, CONTENT_OFFSET),
    [popper.placement, props.asChild],
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
      selectContext.contentRef.current = guiObject;
      contentBoundaryRef.current = guiObject;
      motion.ref.current = guiObject;
    },
    [motion.ref, selectContext.contentRef],
  );

  const handleDismiss = React.useCallback(() => {
    selectContext.setOpen(false);
  }, [selectContext.setOpen]);

  const shouldRender = motion.mounted;
  const contentVisible = shouldRender && (motion.present || motion.phase !== "exited");
  const popperPosition = popper.isPositioned ? popper.position : HIDDEN_POSITION;
  const popperContentSize = (popper as { contentSize?: Vector2 }).contentSize ?? new Vector2(0, 0);
  const popperWrapperSize = popper.isPositioned
    ? UDim2.fromOffset(popperContentSize.X, popperContentSize.Y)
    : UDim2.fromOffset(0, 0);

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[SelectContent] `asChild` requires a child element.");
      }

      const childProps = toGuiPropBag((child as { props?: unknown }).props);
      const childRef = getElementRef<Instance>(child);

      return React.cloneElement(child as React.ReactElement<GuiPropBag>, {
        ...childProps,
        Visible: contentVisible,
        ref: composeRefs(childRef, setContentRef),
      });
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
      modal={false}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
      contentBoundaryRef={contentBoundaryRef}
    >
      <FocusScope active={open} restoreFocus={true} trapped={false}>
        <frame
          AnchorPoint={popper.anchorPoint}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Position={popperPosition}
          Size={popperWrapperSize}
          Visible={shouldRender}
        >
          {contentNode}
        </frame>
      </FocusScope>
    </DismissableLayer>
  );
}

export function SelectContent(props: SelectContentProps) {
  const selectContext = useSelectContext();
  const open = selectContext.open;

  if (props.forceMount) {
    return (
      <SelectContentImpl
        motionPresent={open}
        transition={props.transition}
        placement={props.placement}
        sideOffset={props.sideOffset}
        alignOffset={props.alignOffset}
        collisionPadding={props.collisionPadding}
        forceMount={props.forceMount}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        asChild={props.asChild}
      >
        {props.children}
      </SelectContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <SelectContentImpl
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={props.transition}
          placement={props.placement}
          sideOffset={props.sideOffset}
          alignOffset={props.alignOffset}
          collisionPadding={props.collisionPadding}
          forceMount={props.forceMount}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          asChild={props.asChild}
        >
          {props.children}
        </SelectContentImpl>
      )}
    />
  );
}
