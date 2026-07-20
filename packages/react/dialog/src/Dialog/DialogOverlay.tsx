import { Presence, usePortalContext } from "@lattice-ui/react-layer";
import { type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/react-motion";
import {
  composeEvents,
  composeRefs,
  getPassthroughProps,
  getSlotChild,
  type PassthroughProps,
  React,
  Slot,
  toSlotProps,
} from "@lattice-ui/react-runtime";
import { useDialogContext } from "./context";
import type { DialogOverlayProps } from "./types";

const OWN_PROPS = ["asChild", "forceMount", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that; the dim color and its transparency are appearance and
// belong to the consumer. A fully transparent overlay still hit-tests, so it keeps blocking input.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

// An unstyled overlay has nothing to fade, so there is no default recipe. Presence timing is still
// owned here; consumers opt into motion by animating their own `asChild` overlay.
const NO_MOTION: PresenceMotionConfig = {};

function DialogOverlayImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  forceMount?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
  passthrough: PassthroughProps<TextButton>;
}) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;

  const motion = usePresenceMotionController<GuiObject>({
    present: props.motionPresent,
    forceMount: props.forceMount,
    config: NO_MOTION,
    onExitComplete: props.onExitComplete,
  });
  const shouldRender = motion.mounted;
  const overlayVisible = shouldRender && motion.phase !== "exited";

  const handleActivated = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  const passthrough = props.passthrough;
  const behaviorProps = {
    Active: open,
    Event: composeEvents(passthrough.Event, { Activated: handleActivated }),
    Selectable: false,
    Visible: overlayVisible,
    ref: composeRefs<GuiObject>(passthrough.ref as never, motion.ref) as never,
  };

  if (props.asChild) {
    const child = props.children;
    if (getSlotChild(child) === undefined) {
      error("[DialogOverlay] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  // Full-screen so the overlay actually covers and intercepts input: hit-testing, not a size
  // design choice. ZIndex keeps the dim below the dialog content it shares a host with.
  return (
    <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} Size={UDim2.fromScale(1, 1)} ZIndex={5}>
      {props.children}
    </textbutton>
  );
}

function DialogOverlayGui(props: { children?: React.ReactNode }) {
  // The overlay is portaled into BasePlayerGui by Dialog.Portal; a GuiObject
  // without a LayerCollector (ScreenGui) ancestor never renders in Roblox, so
  // it needs its own ScreenGui host. DisplayOrder sits at the layer base,
  // below every DismissableLayer (base + stackOrder, stackOrder >= 1) so the
  // dialog content always renders above its own dim.
  const portalContext = usePortalContext();

  return (
    <screengui
      DisplayOrder={portalContext.displayOrderBase}
      IgnoreGuiInset={true}
      ResetOnSpawn={false}
      ScreenInsets={Enum.ScreenInsets.None}
      ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
    >
      {props.children}
    </screengui>
  );
}

export function DialogOverlay(props: DialogOverlayProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;
  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);

  if (props.forceMount) {
    return (
      <DialogOverlayGui>
        <DialogOverlayImpl
          asChild={props.asChild}
          forceMount={props.forceMount}
          motionPresent={open}
          passthrough={passthrough}
        >
          {props.children}
        </DialogOverlayImpl>
      </DialogOverlayGui>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <DialogOverlayGui>
          <DialogOverlayImpl
            asChild={props.asChild}
            forceMount={props.forceMount}
            motionPresent={state.isPresent}
            onExitComplete={state.onExitComplete}
            passthrough={passthrough}
          >
            {props.children}
          </DialogOverlayImpl>
        </DialogOverlayGui>
      )}
    />
  );
}
