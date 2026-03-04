import { React, Slot } from "@lattice-ui/core";
import { useTextareaContext } from "./context";
import type { TextareaMessageProps } from "./types";

export function TextareaMessage(props: TextareaMessageProps) {
  const textareaContext = useTextareaContext();

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextareaMessage] `asChild` requires a child element.");
    }

    return (
      <Slot Name="TextareaMessage" Text="Message">
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
        textareaContext.invalid === true
          ? Color3.fromRGB(255, 128, 128)
          : textareaContext.disabled
            ? Color3.fromRGB(132, 139, 154)
            : Color3.fromRGB(170, 179, 195)
      }
      TextSize={13}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}
