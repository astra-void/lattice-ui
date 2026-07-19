import { composeRefs, getElementRef, React } from "@lattice-ui/core";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createCanvasGroupPopperEntranceRecipe, usePresenceMotionController } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import { usePopper } from "@lattice-ui/popper";
import { useContextMenuContext } from "./context";
import type { ContextMenuContentProps } from "./types";

const HIDDEN_POSITION = UDim2.fromOffset(-9999, -9999);
const ZERO_VECTOR2 = new Vector2(0, 0);

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

function ContextMenuContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: ContextMenuContentProps["transition"];
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
  const contextMenuContext = useContextMenuContext();
  const open = contextMenuContext.open;
  const anchorPosition = contextMenuContext.anchorPosition;
  const shouldMeasure = open || props.motionPresent || props.onExitComplete !== undefined;
  const contentBoundaryRef = React.useRef<GuiObject>();

  const popper = usePopper({
    anchorRef: contextMenuContext.virtualAnchorRef,
    contentRef: contextMenuContext.contentRef,
    alignOffset: props.alignOffset,
    collisionPadding: props.collisionPadding,
    sideOffset: props.sideOffset,
    placement: props.placement ?? "bottom",
    enabled: shouldMeasure,
  });

  const defaultTransition = React.useMemo(
    () => createCanvasGroupPopperEntranceRecipe(popper.placement),
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
      contextMenuContext.contentRef.current = guiObject;
      contentBoundaryRef.current = guiObject;
      motion.ref.current = guiObject;
    },
    [contextMenuContext.contentRef, motion.ref],
  );

  const setVirtualAnchorRef = React.useCallback(
    (instance: Instance | undefined) => {
      contextMenuContext.virtualAnchorRef.current = toGuiObject(instance);
    },
    [contextMenuContext.virtualAnchorRef],
  );

  const handleDismiss = React.useCallback(() => {
    contextMenuContext.setOpen(false);
  }, [contextMenuContext.setOpen]);

  const shouldRender = motion.mounted;
  const contentVisible = shouldRender && (motion.present || (!props.forceMount && motion.phase !== "exited"));
  const popperPosition = popper.isPositioned ? popper.position : HIDDEN_POSITION;
  const popperContentSize = (popper as { contentSize?: Vector2 }).contentSize ?? ZERO_VECTOR2;
  const popperWrapperSize = popper.isPositioned
    ? UDim2.fromOffset(popperContentSize.X, popperContentSize.Y)
    : UDim2.fromOffset(0, 0);

  // Sizing the virtual anchor to the content width (with zero height) makes the
  // shared popper place the menu's top-left corner at the pointer instead of
  // centering it, matching conventional context-menu behavior.
  const virtualAnchorSize = UDim2.fromOffset(popperContentSize.X, 0);

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[ContextMenuContent] `asChild` requires a child element.");
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
      modal={contextMenuContext.modal}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
      contentBoundaryRef={contentBoundaryRef}
    >
      <frame
        BackgroundTransparency={1}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(anchorPosition.X, anchorPosition.Y)}
        Size={virtualAnchorSize}
        Visible={false}
        ref={setVirtualAnchorRef}
      />
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
    </DismissableLayer>
  );
}

export function ContextMenuContent(props: ContextMenuContentProps) {
  const contextMenuContext = useContextMenuContext();
  const open = contextMenuContext.open;

  if (props.forceMount) {
    return (
      <ContextMenuContentImpl
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
      </ContextMenuContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <ContextMenuContentImpl
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
        </ContextMenuContentImpl>
      )}
    />
  );
}
