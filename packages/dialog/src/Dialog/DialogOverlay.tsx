import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { createOverlayFadeRecipe, usePresenceMotion } from "@lattice-ui/motion";
import { useDialogContext } from "./context";
import type { DialogOverlayProps } from "./types";

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
  const motionRef = usePresenceMotion<GuiObject>(props.motionPresent, config, props.onExitComplete);

  const handleActivated = React.useCallback(() => {
    dialogContext.setOpen(false);
  }, [dialogContext.setOpen]);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[DialogOverlay] `asChild` requires a child element.");
    }

    return (
      <Slot Active={open} Event={{ Activated: handleActivated }} ref={motionRef}>
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
      ZIndex={5}
      ref={motionRef as React.MutableRefObject<TextButton>}
    />
  );
}

export function DialogOverlay(props: DialogOverlayProps) {
  const dialogContext = useDialogContext();
  const open = dialogContext.open;

  if (props.forceMount) {
    return (
      <DialogOverlayImpl motionPresent={open} forceMount={props.forceMount} asChild={props.asChild}>
        {props.children}
      </DialogOverlayImpl>
    );
  }

  return (
    <Presence
      present={open}
      render={(state) => (
        <DialogOverlayImpl
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          forceMount={props.forceMount}
          asChild={props.asChild}
        >
          {props.children}
        </DialogOverlayImpl>
      )}
    />
  );
}
