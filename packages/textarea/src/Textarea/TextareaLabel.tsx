import { React, Slot } from "@lattice-ui/core";
import { useTextareaContext } from "./context";
import type { TextareaLabelProps } from "./types";

export function TextareaLabel(props: TextareaLabelProps) {
  const textareaContext = useTextareaContext();
  const disabled = textareaContext.disabled;

  const handleActivated = React.useCallback(() => {
    if (disabled) {
      return;
    }

    textareaContext.inputRef.current?.CaptureFocus();
  }, [disabled, textareaContext.inputRef]);

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
      error("[TextareaLabel] `asChild` requires a child element.");
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
