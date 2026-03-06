import { React, Slot } from "@lattice-ui/core";
import { useComboboxContext } from "./context";
import type { ComboboxInputProps } from "./types";

function toTextBox(instance: Instance | undefined) {
  if (!instance || !instance.IsA("TextBox")) {
    return undefined;
  }

  return instance;
}

export function ComboboxInput(props: ComboboxInputProps) {
  const comboboxContext = useComboboxContext();
  const disabled = comboboxContext.disabled || props.disabled === true;
  const readOnly = comboboxContext.readOnly || props.readOnly === true;
  const keyboardNavigation = comboboxContext.keyboardNavigation;

  const setInputRef = React.useCallback(
    (instance: Instance | undefined) => {
      comboboxContext.inputRef.current = toTextBox(instance);
    },
    [comboboxContext.inputRef],
  );

  const handleTextChanged = React.useCallback(
    (textBox: TextBox) => {
      if (disabled || readOnly) {
        if (textBox.Text !== comboboxContext.inputValue) {
          textBox.Text = comboboxContext.inputValue;
        }

        return;
      }

      comboboxContext.setInputValue(textBox.Text);
    },
    [comboboxContext, disabled, readOnly],
  );

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyboardNavigation && (keyCode === Enum.KeyCode.Down || keyCode === Enum.KeyCode.Up)) {
        comboboxContext.setOpen(true);
      }
    },
    [comboboxContext, disabled, keyboardNavigation],
  );

  const sharedProps = {
    Active: !disabled,
    ClearTextOnFocus: false,
    PlaceholderText: props.placeholder ?? "Type to filter",
    Selectable: !disabled && keyboardNavigation,
    Text: comboboxContext.inputValue,
    TextEditable: !disabled && !readOnly,
    Change: {
      Text: handleTextChanged,
    },
    Event: {
      InputBegan: handleInputBegan,
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
