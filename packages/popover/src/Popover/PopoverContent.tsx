import { composeRefs, React } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { createCanvasGroupPopperEntranceRecipe, usePresenceMotionController } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import { usePopper } from "@lattice-ui/popper";
import { usePopoverContext } from "./context";
import type { PopoverContentProps } from "./types";

const CONTENT_OFFSET = 10;
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

function PopoverContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: PopoverContentProps["transition"];
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  forceMount?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const popoverContext = usePopoverContext();
  const open = popoverContext.open;
  const shouldMeasure = open || props.motionPresent || props.onExitComplete !== undefined;
  const contentBoundaryRef = React.useRef<GuiObject>();

  const anchorRef = popoverContext.anchorRef.current ? popoverContext.anchorRef : popoverContext.triggerRef;

  const popper = usePopper({
    anchorRef,
    contentRef: popoverContext.contentRef,
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
      popoverContext.contentRef.current = guiObject;
      contentBoundaryRef.current = guiObject;
      motion.ref.current = guiObject;
    },
    [motion.ref, popoverContext.contentRef],
  );

  const handleDismiss = React.useCallback(() => {
    popoverContext.setOpen(false);
  }, [popoverContext.setOpen]);

  const shouldRender = motion.mounted;
  const isActuallyVisible = shouldRender && motion.phase !== "exited";
  const popperPosition = popper.isPositioned ? popper.position : HIDDEN_POSITION;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[PopoverContent] `asChild` requires a child element.");
      }

      const childProps = toGuiPropBag((child as { props?: unknown }).props);

      return (
        <canvasgroup
          AutomaticSize={Enum.AutomaticSize.XY}
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Size={UDim2.fromOffset(0, 0)}
          Visible={isActuallyVisible}
          ref={setContentRef as React.Ref<CanvasGroup>}
        >
          {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
            ...childProps,
            Position: UDim2.fromOffset(0, 0),
            ref: composeRefs((childProps as { ref?: React.Ref<Instance> }).ref),
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
      Visible={isActuallyVisible}
      ref={setContentRef}
    >
      {props.children}
    </canvasgroup>
  );

  return (
    <DismissableLayer
      enabled={open}
      modal={popoverContext.modal}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
      contentBoundaryRef={contentBoundaryRef}
    >
      <FocusScope active={open} restoreFocus={true} trapped={popoverContext.modal}>
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
      </FocusScope>
    </DismissableLayer>
  );
}

export function PopoverContent(props: PopoverContentProps) {
  const popoverContext = usePopoverContext();
  const open = popoverContext.open;

  if (props.forceMount) {
    return (
      <PopoverContentImpl
        motionPresent={open}
        transition={props.transition}
        placement={props.placement}
        offset={props.offset}
        padding={props.padding}
        forceMount={props.forceMount}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        asChild={props.asChild}
      >
        {props.children}
      </PopoverContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <PopoverContentImpl
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={props.transition}
          placement={props.placement}
          offset={props.offset}
          padding={props.padding}
          forceMount={props.forceMount}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          asChild={props.asChild}
        >
          {props.children}
        </PopoverContentImpl>
      )}
    />
  );
}
