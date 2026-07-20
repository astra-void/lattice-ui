import { useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useTextFieldContext } from "./context";
import type { TextFieldInputProps } from "./types";

const OWN_PROPS = ["asChild", "disabled", "readOnly", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbox` renders an opaque grey box
// labelled "TextBox". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, placeholder text) to the consumer. Passthrough props are spread after these, so they stay
// overridable — and the controlled `Text` lands in the behavior props spread last of all.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

function toTextBox(instance: Instance | undefined) {
  if (!instance?.IsA("TextBox")) {
    return undefined;
  }

  return instance;
}

export function TextFieldInput(props: TextFieldInputProps) {
  const textFieldContext = useTextFieldContext();
  const disabled = textFieldContext.disabled || props.disabled === true;
  const readOnly = textFieldContext.readOnly || props.readOnly === true;
  const [focused, setFocused] = React.useState(false);

  const focusRef = React.useRef<GuiObject>();
  useFocusNode({
    ref: focusRef,
    disabled,
    // While the field is being edited, arrow keys move the text cursor, so the
    // navigation controller passes them through instead of moving focus.
    getCapturesDirectional: () => focused,
  });

  const setInputRef = React.useCallback(
    (instance: Instance | undefined) => {
      const textBox = toTextBox(instance);
      textFieldContext.inputRef.current = textBox;
      focusRef.current = textBox;
    },
    [textFieldContext.inputRef],
  );

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

  const passthrough = getPassthroughProps<TextBox>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    ClearTextOnFocus: false,
    Selectable: !disabled,
    Text: textFieldContext.value,
    TextEditable: !disabled && !readOnly,
    Change: composeEvents(passthrough.Change, {
      Text: handleTextChanged as Callback,
    }),
    Event: composeEvents(passthrough.Event, {
      Focused: handleFocused as Callback,
      FocusLost: handleFocusLost as Callback,
    }),
    ref: composeRefs<Instance>(passthrough.ref as never, setInputRef),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextFieldInput] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return (
    <textbox {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
      {props.children}
    </textbox>
  );
}
