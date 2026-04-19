import { React, Slot } from "@lattice-ui/core";
import { useComboboxContext } from "./context";
import type { ComboboxInputProps } from "./types";

const UserInputService = game.GetService("UserInputService");

function toTextBox(instance: Instance | undefined) {
  if (!instance?.IsA("TextBox")) {
    return undefined;
  }

  return instance;
}

export function ComboboxInput(props: ComboboxInputProps) {
  const comboboxContext = useComboboxContext();
  const disabled = comboboxContext.disabled || props.disabled === true;
  const readOnly = comboboxContext.readOnly || props.readOnly === true;

  const setInputRef = React.useCallback(
    (instance: Instance | undefined) => {
      const previousInput = comboboxContext.inputRef.current;
      const nextInput = toTextBox(instance);

      comboboxContext.inputRef.current = nextInput;

      if (nextInput) {
        comboboxContext.anchorRef.current = nextInput;
        return;
      }

      if (comboboxContext.anchorRef.current === previousInput) {
        comboboxContext.anchorRef.current = comboboxContext.triggerRef.current;
      }
    },
    [comboboxContext.anchorRef, comboboxContext.inputRef, comboboxContext.triggerRef],
  );

  const lastInputValueRef = React.useRef(comboboxContext.inputValue);
  lastInputValueRef.current = comboboxContext.inputValue;

  const handleTextChanged = React.useCallback(
    (textBox: TextBox) => {
      if (textBox.Text === lastInputValueRef.current) {
        return;
      }

      if (UserInputService.GetFocusedTextBox() !== textBox) {
        return;
      }

      if (disabled || readOnly) {
        if (textBox.Text !== lastInputValueRef.current) {
          textBox.Text = lastInputValueRef.current;
        }

        return;
      }

      comboboxContext.setInputValue(textBox.Text);
    },
    [comboboxContext, disabled, readOnly],
  );

  const sharedProps = {
    Active: !disabled,
    ClearTextOnFocus: false,
    PlaceholderText: props.placeholder ?? "Type to filter",
    Selectable: !disabled,
    Text: comboboxContext.inputValue,
    TextEditable: !disabled && !readOnly,
    Change: {
      Text: handleTextChanged,
    },
    ref: setInputRef,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ComboboxInput] `asChild` requires a child element.");
    }

    return <Slot {...sharedProps}>{child}</Slot>;
  }

  return (
    <textbox
      {...sharedProps}
      BackgroundColor3={Color3.fromRGB(39, 46, 61)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(240, 36)}
      TextColor3={disabled ? Color3.fromRGB(137, 145, 162) : Color3.fromRGB(235, 240, 248)}
      TextSize={15}
      TextXAlignment={Enum.TextXAlignment.Left}
    >
      <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} />
    </textbox>
  );
}
