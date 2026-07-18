import { React, Slot } from "@lattice-ui/core";
import { Presence, usePortalContext } from "@lattice-ui/layer";
import { createOverlayFadeRecipe, usePresenceMotionController } from "@lattice-ui/motion";
import { useDialogContext } from "./context";
import type { DialogOverlayProps } from "./types";

function resolveOverlayChild(child: React.ReactNode): React.ReactElement | undefined {
  if (!React.isValidElement(child)) {
    return undefined;
  }

  if (child.type !== React.Fragment) {
    return child;
  }

  let resolvedChild: React.ReactElement | undefined;
  let foundExtraChild = false;
  const fragmentProps = child.props as { children?: React.ReactNode };

  React.Children.map(fragmentProps.children, (fragmentChild) => {
    const candidate = resolveOverlayChild(fragmentChild);
    if (!candidate) {
      return fragmentChild;
    }

    if (resolvedChild) {
      foundExtraChild = true;
      return fragmentChild;
    }

    resolvedChild = candidate;
    return fragmentChild;
  });

  if (foundExtraChild) {
    error("[DialogOverlay] `asChild` with a fragment requires exactly one child element.");
  }

  return resolvedChild;
}

function DialogOverlayImpl(props: {
  motionPresent: boolean;
  onExitComplete?: () => void;
  forceMount?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;

  const config = React.useMemo(() => createOverlayFadeRecipe(), []);
  const motion = usePresenceMotionController<GuiObject>({
    present: props.motionPresent,
    forceMount: props.forceMount,
    config,
    onExitComplete: props.onExitComplete,
  });
  const shouldRender = motion.mounted;
  const overlayVisible = shouldRender && motion.phase !== "exited";

  const handleActivated = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  if (props.asChild) {
    const child = resolveOverlayChild(props.children);
    if (!child) {
      error("[DialogOverlay] `asChild` requires a child element.");
    }

    return (
      <Slot Active={open} Event={{ Activated: handleActivated }} Visible={overlayVisible} ref={motion.ref}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={open}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(8, 10, 14)}
      BorderSizePixel={0}
      Event={{ Activated: handleActivated }}
      Position={UDim2.fromScale(0, 0)}
      Selectable={false}
      Size={UDim2.fromScale(1, 1)}
      Text=""
      TextTransparency={1}
      Visible={overlayVisible}
      ZIndex={5}
      ref={motion.ref as React.MutableRefObject<TextButton>}
    />
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

  if (props.forceMount) {
    return (
      <DialogOverlayGui>
        <DialogOverlayImpl motionPresent={open} forceMount={props.forceMount} asChild={props.asChild}>
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
            motionPresent={state.isPresent}
            onExitComplete={state.onExitComplete}
            forceMount={props.forceMount}
            asChild={props.asChild}
          >
            {props.children}
          </DialogOverlayImpl>
        </DialogOverlayGui>
      )}
    />
  );
}
