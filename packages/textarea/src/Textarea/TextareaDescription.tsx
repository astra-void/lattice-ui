import { React, Slot } from "@lattice-ui/core";
import { useTextareaContext } from "./context";
import type { TextareaDescriptionProps } from "./types";

export function TextareaDescription(props: TextareaDescriptionProps) {
  const textareaContext = useTextareaContext();

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextareaDescription] `asChild` requires a child element.");
    }

    return (
      <Slot Name="TextareaDescription" Text="Description">
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
      TextColor3={textareaContext.disabled ? Color3.fromRGB(132, 139, 154) : Color3.fromRGB(170, 179, 195)}
      TextSize={13}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}
