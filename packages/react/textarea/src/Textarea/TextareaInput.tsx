import { useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { resolveAutoResizeSize, resolveTextareaHeight } from "./autoResize";
import { useTextareaContext } from "./context";
import type { TextareaInputProps } from "./types";

const OWN_PROPS = ["asChild", "disabled", "readOnly", "lineHeight", "children"] as const;

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

  return verticalPadding;
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

export function TextareaInput(props: TextareaInputProps) {
  const textareaContext = useTextareaContext();
  const disabled = textareaContext.disabled || props.disabled === true;
  const readOnly = textareaContext.readOnly || props.readOnly === true;
  const [focused, setFocused] = React.useState(false);

  const focusRef = React.useRef<GuiObject>();
  useFocusNode({
    ref: focusRef,
    disabled,
    // While editing, arrow keys move the text cursor across lines, so the
    // navigation controller passes them through instead of moving focus.
    getCapturesDirectional: () => focused,
  });

  const setInputRef = React.useCallback(
    (instance: Instance | undefined) => {
      const textBox = toTextBox(instance);
      textareaContext.inputRef.current = textBox;
      focusRef.current = textBox;
    },
    [textareaContext.inputRef],
  );

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

      const nextSize = resolveAutoResizeSize(textBox.Size, height);
      if (nextSize !== undefined) {
        textBox.Size = nextSize;
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

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    ClearTextOnFocus: false,
    MultiLine: true,
    Selectable: !disabled,
    Text: textareaContext.value,
    TextEditable: !disabled && !readOnly,
    // Multiline only wraps at the box edge when TextWrapped is on; without it the
    // auto-resize measurement below can never see more than one rendered line.
    TextWrapped: true,
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
      error("[TextareaInput] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...passthrough} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return <textbox {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} />;
}
