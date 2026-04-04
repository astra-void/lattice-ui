import { React, Slot } from "@lattice-ui/core";
import { buildTweenTransition } from "@lattice-ui/motion";
import { useMotionTween } from "@lattice-ui/motion";
import { useTextFieldContext } from "./context";
import type { TextFieldInputProps } from "./types";

function toTextBox(instance: Instance | undefined) {
  if (!instance || !instance.IsA("TextBox")) {
    return undefined;
  }

  return instance;
}

const transition = buildTweenTransition(
  { BackgroundColor3: Color3.fromRGB(47, 53, 68) }, // Focused
  { BackgroundColor3: Color3.fromRGB(39, 46, 61) }, // Default
);

export function TextFieldInput(props: TextFieldInputProps) {
  const textFieldContext = useTextFieldContext();
  const disabled = textFieldContext.disabled || props.disabled === true;
  const readOnly = textFieldContext.readOnly || props.readOnly === true;
  const [focused, setFocused] = React.useState(false);

  const localRef = React.useRef<TextBox>();

  const setInputRef = React.useCallback(
    (instance: Instance | undefined) => {
      localRef.current = toTextBox(instance);
      textFieldContext.inputRef.current = toTextBox(instance);
    },
    [textFieldContext.inputRef],
  );

  useMotionTween(localRef as React.MutableRefObject<Instance | undefined>, {
    active: focused && !disabled && !readOnly,
    transition,
  });

  const handleTextChanged = React.useCallback(
    (textBox: TextBox) => {
      if (disabled || readOnly) {
        if (textBox.Text !== textFieldContext.value) {
          textBox.Text = textFieldContext.value;
        }

        return;
      }

      textFieldContext.setValue(textBox.Text);
    },
    [disabled, readOnly, textFieldContext],
  );

  const handleFocused = React.useCallback(() => {
    setFocused(true);
  }, []);

  const handleFocusLost = React.useCallback(
    (textBox: TextBox) => {
      setFocused(false);
      if (disabled) {
        return;
      }

      textFieldContext.commitValue(textBox.Text);
    },
    [disabled, textFieldContext],
  );

  const sharedProps = {
    Active: !disabled,
    ClearTextOnFocus: false,
    Selectable: !disabled,
    Text: textFieldContext.value,
    TextEditable: !disabled && !readOnly,
    Change: {
      Text: handleTextChanged,
    },
    Event: {
      Focused: handleFocused,
      FocusLost: handleFocusLost,
    },
    ref: setInputRef,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextFieldInput] `asChild` requires a child element.");
    }

    return <Slot {...sharedProps}>{child}</Slot>;
  }

  return (
    <textbox
      {...sharedProps}
      BackgroundColor3={focused && !disabled && !readOnly ? Color3.fromRGB(47, 53, 68) : Color3.fromRGB(39, 46, 61)}
      BorderSizePixel={0}
      PlaceholderText="Type..."
      Size={UDim2.fromOffset(240, 36)}
      TextColor3={disabled ? Color3.fromRGB(137, 145, 162) : Color3.fromRGB(235, 240, 248)}
      TextSize={15}
      TextXAlignment={Enum.TextXAlignment.Left}
    >
      <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} />
    </textbox>
  );
}
