import { React, Slot } from "@lattice-ui/core";
import { focusGuiObject, useFocusNode } from "@lattice-ui/focus";
import { useDialogContext } from "./context";
import type { DialogTriggerProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function DialogTrigger(props: DialogTriggerProps) {
  const dialogContext = useDialogContext();
  const triggerRef = dialogContext.triggerRef;

  const setTriggerRef = React.useCallback(
    (instance: Instance | undefined) => {
      triggerRef.current = toGuiObject(instance);
    },
    [triggerRef],
  );

  useFocusNode({
    ref: triggerRef,
    disabled: props.disabled === true,
    syncToRoblox: false,
  });

  const handleActivated = React.useCallback(() => {
    if (props.disabled) {
      return;
    }

    focusGuiObject(triggerRef.current);
    dialogContext.setOpen(true);
  }, [dialogContext.setOpen, props.disabled, triggerRef]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[DialogTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot
        Active={props.disabled !== true}
        Event={{ Activated: handleActivated }}
        Selectable={false}
        ref={setTriggerRef}
      >
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
      Selectable={false}
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
