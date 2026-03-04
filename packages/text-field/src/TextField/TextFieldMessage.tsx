import { React, Slot } from "@lattice-ui/core";
import { useTextFieldContext } from "./context";
import type { TextFieldMessageProps } from "./types";

export function TextFieldMessage(props: TextFieldMessageProps) {
  const textFieldContext = useTextFieldContext();

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextFieldMessage] `asChild` requires a child element.");
    }

    return (
      <Slot Name="TextFieldMessage" Text="Message">
        {child}
      </Slot>
    );
  }

  return (
    <textlabel
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(300, 20)}
      Text="Message"
      TextColor3={
        textFieldContext.invalid === true
          ? Color3.fromRGB(255, 128, 128)
          : textFieldContext.disabled
            ? Color3.fromRGB(132, 139, 154)
            : Color3.fromRGB(170, 179, 195)
      }
      TextSize={13}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}
