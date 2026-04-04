import { React, Slot } from "@lattice-ui/core";
import { buildTweenTransition } from "@lattice-ui/motion";
import { useMotionTween } from "@lattice-ui/motion";
import { resolveTextareaHeight } from "./autoResize";
import { useTextareaContext } from "./context";
import type { TextareaInputProps } from "./types";

function toTextBox(instance: Instance | undefined) {
  if (!instance || !instance.IsA("TextBox")) {
    return undefined;
  }

  return instance;
}

function resolveVerticalPadding(textBox: TextBox) {
  let verticalPadding = 0;

  for (const child of textBox.GetChildren()) {
    if (!child.IsA("UIPadding")) {
      continue;
    }

    verticalPadding += child.PaddingTop.Offset + child.PaddingBottom.Offset;
    verticalPadding += math.floor(child.PaddingTop.Scale * textBox.AbsoluteSize.Y);
    verticalPadding += math.floor(child.PaddingBottom.Scale * textBox.AbsoluteSize.Y);
  }

  return verticalPadding > 0 ? verticalPadding : 14;
}

function resolveLineHeight(textBox: TextBox, explicitLineHeight: number | undefined) {
  if (explicitLineHeight !== undefined) {
    return math.max(1, explicitLineHeight);
  }

  return math.max(1, math.ceil(textBox.TextSize * 1.2));
}

function resolveMeasuredRows(textBox: TextBox, lineHeight: number) {
  const textBoundsHeight = math.max(lineHeight, textBox.TextBounds.Y);
  return math.max(1, math.ceil(textBoundsHeight / lineHeight));
}

const transition = buildTweenTransition(
  { BackgroundColor3: Color3.fromRGB(47, 53, 68) }, // Focused
  { BackgroundColor3: Color3.fromRGB(39, 46, 61) }, // Default
);

export function TextareaInput(props: TextareaInputProps) {
  const textareaContext = useTextareaContext();
  const disabled = textareaContext.disabled || props.disabled === true;
  const readOnly = textareaContext.readOnly || props.readOnly === true;
  const [focused, setFocused] = React.useState(false);

  const localRef = React.useRef<TextBox>();

  const setInputRef = React.useCallback(
    (instance: Instance | undefined) => {
      localRef.current = toTextBox(instance);
      textareaContext.inputRef.current = toTextBox(instance);
    },
    [textareaContext.inputRef],
  );

  useMotionTween(localRef as React.MutableRefObject<Instance | undefined>, {
    active: focused && !disabled && !readOnly,
    transition,
  });

  const applyAutoResize = React.useCallback(
    (textBox: TextBox) => {
      if (!textareaContext.autoResize) {
        return;
      }

      const lineHeight = resolveLineHeight(textBox, props.lineHeight);
      const verticalPadding = resolveVerticalPadding(textBox);
      const measuredRows = resolveMeasuredRows(textBox, lineHeight);

      const height = resolveTextareaHeight(textBox.Text, {
        lineHeight,
        minRows: textareaContext.minRows,
        maxRows: textareaContext.maxRows,
        verticalPadding,
        measuredRows,
      });

      const currentSize = textBox.Size;
      if (currentSize.Y.Offset !== height || currentSize.Y.Scale !== 0) {
        textBox.Size = UDim2.fromOffset(currentSize.X.Offset, height);
      }
    },
    [props.lineHeight, textareaContext.autoResize, textareaContext.maxRows, textareaContext.minRows],
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
      task.defer(() => {
        if (textareaContext.inputRef.current === textBox) {
          applyAutoResize(textBox);
        }
      });
    },
    [applyAutoResize, disabled, readOnly, textareaContext],
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
    task.defer(() => {
      if (textareaContext.inputRef.current === input) {
        applyAutoResize(input);
      }
    });
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
      Focused: handleFocused,
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
      BackgroundColor3={focused && !disabled && !readOnly ? Color3.fromRGB(47, 53, 68) : Color3.fromRGB(39, 46, 61)}
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
