import { FocusScope } from "@lattice-ui/react-focus";
import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import { DismissableLayer, Presence } from "@lattice-ui/react-layer";
import type { PresenceMotionConfig } from "@lattice-ui/react-motion";
import { usePresenceMotionController } from "@lattice-ui/react-motion";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import { usePopper } from "@lattice-ui/react-popper";
import {
  composeRefs,
  getElementRef,
  getPassthroughProps,
  type PassthroughProps,
  React,
} from "@lattice-ui/react-runtime";
import { useMenuContext } from "./context";
import type { MenuContentProps } from "./types";

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

// See MenuTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// Unstyled content has nothing to animate, so there is no default recipe. Presence timing is still
// owned here; consumers opt into motion with `transition`.
const NO_MOTION: PresenceMotionConfig = {};

const HIDDEN_POSITION = UDim2.fromOffset(-9999, -9999);
const ZERO_UDIM2 = UDim2.fromOffset(0, 0);

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

function MenuContentImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  transition?: MenuContentProps["transition"];
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
  const menuContext = useMenuContext();
  const open = menuContext.open;
  const shouldMeasure = open || props.motionPresent || props.onExitComplete !== undefined;
  const contentBoundaryRef = React.useRef<GuiObject>();

  const popper = usePopper({
    anchorRef: menuContext.triggerRef,
    contentRef: menuContext.contentRef,
    alignOffset: props.alignOffset,
    collisionPadding: props.collisionPadding,
    sideOffset: props.sideOffset,
    placement: props.placement,
    enabled: shouldMeasure,
  });

  const motion = usePresenceMotionController<GuiObject>({
    present: props.motionPresent,
    ready: popper.isPositioned,
    forceMount: props.forceMount,
    config: props.transition ?? NO_MOTION,
    onExitComplete: props.onExitComplete,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      const guiObject = toGuiObject(instance);
      menuContext.contentRef.current = guiObject;
      contentBoundaryRef.current = guiObject;
      motion.ref.current = guiObject;
    },
    [menuContext.contentRef, motion.ref],
  );

  const handleDismiss = React.useCallback(() => {
    menuContext.setOpen(false);
  }, [menuContext.setOpen]);

  const shouldRender = motion.mounted;
  const contentVisible = shouldRender && (motion.present || (!props.forceMount && motion.phase !== "exited"));
  const popperPosition = popper.isPositioned ? popper.position : HIDDEN_POSITION;
  const popperContentSize = (popper as { contentSize?: Vector2 }).contentSize ?? new Vector2(0, 0);
  const popperWrapperSize = popper.isPositioned
    ? UDim2.fromOffset(popperContentSize.X, popperContentSize.Y)
    : ZERO_UDIM2;

  const passthrough = props.passthrough;

  // The canvasgroup measures itself against its items so the popper has something to position, and
  // it is the flattening layer any consumer-supplied `transition` fades as a unit.
  const contentBehaviorProps = {
    AutomaticSize: Enum.AutomaticSize.XY,
    Size: ZERO_UDIM2,
    Visible: contentVisible,
  };

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[MenuContent] `asChild` requires a child element.");
      }

      const childProps = toGuiPropBag((child as { props?: unknown }).props);
      const childRef = getElementRef<Instance>(child);

      return (
        <canvasgroup {...NEUTRAL_PROPS} {...contentBehaviorProps} ref={setContentRef as React.Ref<CanvasGroup>}>
          {/* No neutral defaults here: the rendered element belongs to the consumer. */}
          {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
            ...childProps,
            ...passthrough,
            Position: ZERO_UDIM2,
            Visible: contentVisible,
            ref: composeRefs(childRef, (passthrough.ref ?? undefined) as never),
          })}
        </canvasgroup>
      );
    })()
  ) : (
    <canvasgroup {...NEUTRAL_PROPS} {...passthrough} {...contentBehaviorProps} ref={setContentRef}>
      {props.children}
    </canvasgroup>
  );

  return (
    <DismissableLayer
      enabled={open}
      modal={menuContext.modal}
      onDismiss={handleDismiss}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
      contentBoundaryRef={contentBoundaryRef}
      insideRefs={[menuContext.triggerRef]}
    >
      <FocusScope
        active={open}
        restoreFocus={true}
        trapped={menuContext.modal}
        navStrategy="ordered"
        navOrientation="vertical"
        navWrap={true}
      >
        {/* Internal positioning wrapper: owned by the popper, never by the consumer. */}
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

export function MenuContent(props: MenuContentProps) {
  const menuContext = useMenuContext();
  const open = menuContext.open;
  const passthrough = getPassthroughProps<CanvasGroup>(props, OWN_PROPS);

  if (props.forceMount) {
    return (
      <MenuContentImpl
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
      </MenuContentImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <MenuContentImpl
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
        </MenuContentImpl>
      )}
    />
  );
}
