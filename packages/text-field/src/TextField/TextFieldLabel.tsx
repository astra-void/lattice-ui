import { React, Slot } from "@lattice-ui/core";
import { useTextFieldContext } from "./context";
import type { TextFieldLabelProps } from "./types";

export function TextFieldLabel(props: TextFieldLabelProps) {
  const textFieldContext = useTextFieldContext();
  const disabled = textFieldContext.disabled;

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    textFieldContext.inputRef.current?.CaptureFocus();
  }, [disabled, textFieldContext.inputRef]);

  const sharedProps = {
    Active: !disabled,
    Selectable: !disabled,
    Text: "Label",
    Event: {
      Activated: handleActivated,
    },
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextFieldLabel] `asChild` requires a child element.");
    }

    return <Slot {...sharedProps}>{child}</Slot>;
  }

  return (
    <textbutton
      {...sharedProps}
      AutoButtonColor={false}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(240, 22)}
      TextColor3={disabled ? Color3.fromRGB(149, 157, 173) : Color3.fromRGB(225, 231, 241)}
      TextSize={14}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}
