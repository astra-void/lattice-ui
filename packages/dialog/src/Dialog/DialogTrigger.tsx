import { React, Slot } from "@lattice-ui/core";
import { useDialogContext } from "./context";
import type { DialogTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function DialogTrigger(props: DialogTriggerProps) {
  const dialogContext = useDialogContext();

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      dialogContext.triggerRef.current = toGuiObject(instance);
    },
    [dialogContext.triggerRef],
  );

  const handleActivated = React.useCallback(() => {
    if (props.disabled) {
      return;
    }

    dialogContext.setOpen(true);
  }, [dialogContext.setOpen, props.disabled]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[DialogTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot Event={{ Activated: handleActivated }} ref={setTriggerRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={props.disabled !== true}
      AutoButtonColor={false}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Event={{ Activated: handleActivated }}
      Size={UDim2.fromOffset(140, 38)}
      Text="Open Dialog"
      TextColor3={Color3.fromRGB(240, 244, 250)}
      TextSize={16}
      ref={setTriggerRef}
    >
      {props.children}
    </textbutton>
  );
}
