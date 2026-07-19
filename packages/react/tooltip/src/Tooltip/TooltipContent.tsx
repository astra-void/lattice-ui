import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import { DismissableLayer, Presence } from "@lattice-ui/react-layer";
import { type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/react-motion";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import { usePopper } from "@lattice-ui/react-popper";
import { composeRefs, getElementRef, getPassthroughProps, React } from "@lattice-ui/react-runtime";
import { useTooltipContext } from "./context";
import type { TooltipContentProps } from "./types";

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

// See TooltipTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// An unstyled tooltip has nothing to animate, so there is no default recipe. Presence timing is
// still owned here; consumers opt into motion with `transition`.
const NO_MOTION: PresenceMotionConfig = {};

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

function TooltipContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: TooltipContentProps["transition"];
  placement?: PopperPlacement;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  forceMount?: boolean;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  asChild?: boolean;
  children?: React.ReactNode;
  passthrough: Record<string, unknown>;
}) {
  const tooltipContext = useTooltipContext();
  const open = tooltipContext.open;
  const shouldMeasure = open || props.motionPresent || props.onExitComplete !== undefined;
  const contentBoundaryRef = React.useRef<GuiObject>();

  const popper = usePopper({
    anchorRef: tooltipContext.triggerRef,
    contentRef: tooltipContext.contentRef,
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
      tooltipContext.contentRef.current = guiObject;
      contentBoundaryRef.current = guiObject;
      motion.ref.current = guiObject;
    },
    [motion.ref, tooltipContext.contentRef],
  );

  const handleDismiss = React.useCallback(() => {
    tooltipContext.close();
  }, [tooltipContext]);

  const shouldRender = motion.mounted;
  const contentVisible = shouldRender && (motion.present || motion.phase !== "exited");
  const popperPosition = popper.isPositioned ? popper.position : HIDDEN_POSITION;
  const popperContentSize = (popper as { contentSize?: Vector2 }).contentSize ?? new Vector2(0, 0);
  const popperWrapperSize = popper.isPositioned
    ? UDim2.fromOffset(popperContentSize.X, popperContentSize.Y)
    : UDim2.fromOffset(0, 0);

  // The wrapper frame is the popper's positioning shell, not a consumer surface: every prop on it
  // is measurement-driven. Passthrough lands on the content element instead.
  const wrapperProps = {
    ...NEUTRAL_PROPS,
    AnchorPoint: popper.anchorPoint,
    Position: popperPosition,
    Size: popperWrapperSize,
    Visible: shouldRender,
  };

  // AutomaticSize over a zero base size is how the popper measures the content, so it is behavior.
  const contentBehaviorProps = {
    AutomaticSize: Enum.AutomaticSize.XY,
    Size: UDim2.fromOffset(0, 0),
    Visible: contentVisible,
  };

  const passthrough = props.passthrough;

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TooltipContent] `asChild` requires a child element.");
    }

    const childProps = toGuiPropBag((child as { props?: unknown }).props);
    const childRef = getElementRef<Instance>(child);

    return (
      <DismissableLayer
        enabled={open}
        modal={false}
        onDismiss={handleDismiss}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        contentBoundaryRef={contentBoundaryRef}
      >
        <frame {...wrapperProps}>
          <canvasgroup {...NEUTRAL_PROPS} {...contentBehaviorProps} ref={setContentRef as React.Ref<CanvasGroup>}>
            {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
              // No neutral defaults here: the rendered element belongs to the consumer.
              ...childProps,
              ...passthrough,
              Position: UDim2.fromOffset(0, 0),
              Visible: contentVisible,
              ref: composeRefs(childRef),
            })}
          </canvasgroup>
        </frame>
      </DismissableLayer>
    );
  }

  return (
    <DismissableLayer
      enabled={open}
      modal={false}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
      contentBoundaryRef={contentBoundaryRef}
    >
      <frame {...wrapperProps}>
        <canvasgroup {...NEUTRAL_PROPS} {...passthrough} {...contentBehaviorProps} ref={setContentRef}>
          {props.children}
        </canvasgroup>
      </frame>
    </DismissableLayer>
  );
}

export function TooltipContent(props: TooltipContentProps) {
  const tooltipContext = useTooltipContext();
  const open = tooltipContext.open;
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (props.forceMount) {
    return (
      <TooltipContentImpl
        motionPresent={open}
        passthrough={passthrough}
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
      </TooltipContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <TooltipContentImpl
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          passthrough={passthrough}
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
        </TooltipContentImpl>
      )}
    />
  );
}
