import { FocusScope } from "@lattice-ui/react-focus";
import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import { DismissableLayer, Presence } from "@lattice-ui/react-layer";
import { type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/react-motion";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import { usePopper } from "@lattice-ui/react-popper";
import { composeRefs, getElementRef, getPassthroughProps, React } from "@lattice-ui/react-runtime";
import { useSelectContext } from "./context";
import type { SelectContentProps } from "./types";

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

// See SelectTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// Unstyled content has nothing to animate, so there is no default entrance recipe. Presence timing
// is still owned here; consumers opt into motion with `transition`.
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

function SelectContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: PresenceMotionConfig;
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

  const config = props.transition ?? NO_MOTION;

  const motion = usePresenceMotionController<GuiObject>({
    present: props.motionPresent,
    ready: popper.isPositioned,
    forceMount: props.forceMount,
    config,
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

  const passthrough = props.passthrough;

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[SelectContent] `asChild` requires a child element.");
      }

      const childProps = toGuiPropBag((child as { props?: unknown }).props);
      const childRef = getElementRef<Instance>(child);

      // No neutral defaults here: the rendered element belongs to the consumer.
      return React.cloneElement(child as React.ReactElement<GuiPropBag>, {
        ...childProps,
        ...passthrough,
        Visible: contentVisible,
        ref: composeRefs(childRef, passthrough.ref as never, setContentRef),
      });
    })()
  ) : (
    // `AutomaticSize`/`Size` below are measured layout, not styling: automatic sizing from zero is
    // what lets the popper read the content's real extents before positioning it.
    <canvasgroup
      {...NEUTRAL_PROPS}
      {...passthrough}
      AutomaticSize={Enum.AutomaticSize.XY}
      Size={UDim2.fromOffset(0, 0)}
      Visible={contentVisible}
      ref={composeRefs<Instance>(passthrough.ref as never, setContentRef)}
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
      insideRefs={[selectContext.triggerRef]}
    >
      <FocusScope
        active={open}
        restoreFocus={true}
        trapped={false}
        navStrategy="ordered"
        navOrientation="vertical"
        navWrap={true}
      >
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

export function SelectContent(props: SelectContentProps) {
  const selectContext = useSelectContext();
  const open = selectContext.open;
  const passthrough = getPassthroughProps(props, OWN_PROPS);

  if (props.forceMount) {
    return (
      <SelectContentImpl
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
        </SelectContentImpl>
      )}
    />
  );
}
