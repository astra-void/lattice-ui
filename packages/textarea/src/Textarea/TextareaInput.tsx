import { React, Slot } from "@lattice-ui/core";
import { resolveTextareaHeight } from "./autoResize";
import { useTextareaContext } from "./context";
import type { TextareaInputProps } from "./types";

function toTextBox(instance: Instance | undefined) {
  if (!instance || !instance.IsA("TextBox")) {
    return undefined;
  }

  return instance;
}

export function TextareaInput(props: TextareaInputProps) {
  const textareaContext = useTextareaContext();
  const disabled = textareaContext.disabled || props.disabled === true;
  const readOnly = textareaContext.readOnly || props.readOnly === true;
  const lineHeight = props.lineHeight ?? 18;

  const setInputRef = React.useCallback(
    (instance: Instance | undefined) => {
      textareaContext.inputRef.current = toTextBox(instance);
    },
    [textareaContext.inputRef],
  );

  const applyAutoResize = React.useCallback(
    (textBox: TextBox) => {
      if (!textareaContext.autoResize) {
        return;
      }

      const height = resolveTextareaHeight(textBox.Text, {
        lineHeight,
        minRows: textareaContext.minRows,
        maxRows: textareaContext.maxRows,
        verticalPadding: 14,
      });

      const currentSize = textBox.Size;
      if (currentSize.Y.Offset !== height || currentSize.Y.Scale !== 0) {
        textBox.Size = UDim2.fromOffset(currentSize.X.Offset, height);
      }
    },
    [lineHeight, textareaContext.autoResize, textareaContext.maxRows, textareaContext.minRows],
  );

  const handleTextChanged = React.useCallback(
    (textBox: TextBox) => {
      if (disabled || readOnly) {
        if (textBox.Text !== textareaContext.value) {
          textBox.Text = textareaContext.value;
        }

        applyAutoResize(textBox);
        return;
      }

      textareaContext.setValue(textBox.Text);
      applyAutoResize(textBox);
    },
    [applyAutoResize, disabled, readOnly, textareaContext],
  );

  const handleFocusLost = React.useCallback(
    (textBox: TextBox) => {
      if (disabled) {
        return;
      }

      textareaContext.commitValue(textBox.Text);
    },
    [disabled, textareaContext],
  );

  React.useEffect(() => {
    const input = textareaContext.inputRef.current;
    if (!input) {
      return;
    }

    applyAutoResize(input);
  }, [applyAutoResize, textareaContext.inputRef, textareaContext.value]);

  const sharedProps = {
    Active: !disabled,
    ClearTextOnFocus: false,
    MultiLine: true,
    Selectable: !disabled,
    Text: textareaContext.value,
    TextEditable: !disabled && !readOnly,
    TextWrapped: true,
    Change: {
      Text: handleTextChanged,
    },
    Event: {
      FocusLost: handleFocusLost,
    },
    ref: setInputRef,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[TextareaInput] `asChild` requires a child element.");
    }

    return <Slot {...sharedProps}>{child}</Slot>;
  }

  return (
    <textbox
      {...sharedProps}
      BackgroundColor3={Color3.fromRGB(39, 46, 61)}
      BorderSizePixel={0}
      PlaceholderText="Type..."
      Size={UDim2.fromOffset(240, 68)}
      TextColor3={disabled ? Color3.fromRGB(137, 145, 162) : Color3.fromRGB(235, 240, 248)}
      TextSize={15}
      TextXAlignment={Enum.TextXAlignment.Left}
      TextYAlignment={Enum.TextYAlignment.Top}
    >
      <uipadding
        PaddingBottom={new UDim(0, 7)}
        PaddingLeft={new UDim(0, 10)}
        PaddingRight={new UDim(0, 10)}
        PaddingTop={new UDim(0, 7)}
      />
    </textbox>
  );
}
