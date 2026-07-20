import { FocusScope } from "@lattice-ui/react-focus";
import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import { DismissableLayer, Presence } from "@lattice-ui/react-layer";
import { type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/react-motion";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import { usePopper } from "@lattice-ui/react-popper";
import {
  composeRefs,
  getElementRef,
  getPassthroughProps,
  mergeSlotModifiers,
  type PassthroughProps,
  React,
  resolveSlotChildren,
} from "@lattice-ui/react-runtime";
import { usePopoverContext } from "./context";
import type { PopoverContentProps } from "./types";

const HIDDEN_POSITION = UDim2.fromOffset(-9999, -9999);

const OWN_PROPS = [
  "transition",
  "asChild",
  "forceMount",
  "placement",
  "sideOffset",
  "alignOffset",
  "collisionPadding",
  "onPointerDownOutside",
  "onInteractOutside",
  "children",
] as const;

// Roblox instance defaults are themselves a look: a bare canvasgroup renders an opaque grey box.
// Neutralize only that, and leave every real appearance decision to the consumer. Passthrough props
// are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// An unstyled popover has nothing to animate, so there is no default entrance recipe. Presence
// timing is still owned here; consumers opt into motion with `transition`.
const NO_MOTION: PresenceMotionConfig = {};

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

function PopoverContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: PopoverContentProps["transition"];
  placement?: PopperPlacement;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  forceMount?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
  passthrough: PassthroughProps<CanvasGroup>;
}) {
  const popoverContext = usePopoverContext();
  const open = popoverContext.open;
  const shouldMeasure = open || props.motionPresent || props.onExitComplete !== undefined;
  const contentBoundaryRef = React.useRef<GuiObject>();

  const popper = usePopper({
    anchorRef: popoverContext.anchorRef,
    contentRef: popoverContext.contentRef,
    alignOffset: props.alignOffset,
    collisionPadding: props.collisionPadding,
    sideOffset: props.sideOffset,
    placement: props.placement,
    enabled: shouldMeasure,
  });

  const recipe = props.transition ?? NO_MOTION;

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
  const contentVisible = shouldRender && (motion.present || motion.phase !== "exited");
  const popperPosition = popper.isPositioned ? popper.position : HIDDEN_POSITION;
  const popperContentSize = (popper as { contentSize?: Vector2 }).contentSize ?? new Vector2(0, 0);
  const popperWrapperSize = popper.isPositioned
    ? UDim2.fromOffset(popperContentSize.X, popperContentSize.Y)
    : UDim2.fromOffset(0, 0);

  const passthrough = props.passthrough;
  const contentRef = composeRefs<Instance>(passthrough.ref as never, setContentRef);
  const behaviorProps = {
    // The content host measures itself so the popper can position it: measurement, not appearance.
    AutomaticSize: Enum.AutomaticSize.XY,
    Visible: contentVisible,
    ref: contentRef as never,
  };

  const contentNode = props.asChild ? (
    (() => {
      const { target: child, modifiers } = resolveSlotChildren(props.children);
      if (!child) {
        error("[PopoverContent] `asChild` requires a child element.");
      }

      const childProps = toGuiPropBag((child as { props?: unknown }).props);
      const childRef = getElementRef<Instance>(child);

      // No neutral defaults here: the rendered element belongs to the consumer. AutomaticSize is
      // left to the child too, since the consumer owns that element's layout.
      return React.cloneElement(child as React.ReactElement<GuiPropBag>, {
        ...childProps,
        children: mergeSlotModifiers(modifiers, childProps.children),
        ...passthrough,
        Visible: contentVisible,
        ref: composeRefs<Instance>(childRef, contentRef),
      });
    })()
  ) : (
    <canvasgroup {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
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
      insideRefs={[popoverContext.triggerRef, popoverContext.anchorRef]}
    >
      <FocusScope active={open} restoreFocus={true} trapped={popoverContext.modal}>
        {/* Popper-driven placement wrapper: geometry comes from measurement, not from styling. */}
        <frame
          {...NEUTRAL_PROPS}
          AnchorPoint={popper.anchorPoint}
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

export function PopoverContent(props: PopoverContentProps) {
  const popoverContext = usePopoverContext();
  const open = popoverContext.open;
  const passthrough = getPassthroughProps<CanvasGroup>(props, OWN_PROPS);

  if (props.forceMount) {
    return (
      <PopoverContentImpl
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
        passthrough={passthrough}
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
          sideOffset={props.sideOffset}
          alignOffset={props.alignOffset}
          collisionPadding={props.collisionPadding}
          forceMount={props.forceMount}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          asChild={props.asChild}
          passthrough={passthrough}
        >
          {props.children}
        </PopoverContentImpl>
      )}
    />
  );
}
