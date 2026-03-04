import { React, Slot } from "@lattice-ui/core";
import { useTextFieldContext } from "./context";
import type { TextFieldDescriptionProps } from "./types";

export function TextFieldDescription(props: TextFieldDescriptionProps) {
  const textFieldContext = useTextFieldContext();

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextFieldDescription] `asChild` requires a child element.");
    }

    return (
      <Slot Name="TextFieldDescription" Text="Description">
        {child}
      </Slot>
    );
  }

  return (
    <textlabel
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(300, 20)}
      Text="Description"
      TextColor3={textFieldContext.disabled ? Color3.fromRGB(132, 139, 154) : Color3.fromRGB(170, 179, 195)}
      TextSize={13}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}
