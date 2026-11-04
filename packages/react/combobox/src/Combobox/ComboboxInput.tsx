import { useFocusNode } from "@lattice-ui/react-focus";
import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useComboboxContext } from "./context";
import type { ComboboxInputProps } from "./types";

const UserInputService = game.GetService("UserInputService");

const OWN_PROPS = ["asChild", "disabled", "readOnly", "placeholder", "children"] as const;

// See ComboboxTrigger: only the Roblox instance defaults are neutralized, never appearance.
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

export function ComboboxInput(props: ComboboxInputProps) {
  const comboboxContext = useComboboxContext();
  const disabled = comboboxContext.disabled || props.disabled === true;
  const readOnly = comboboxContext.readOnly || props.readOnly === true;

  // Focusing the field opens the list — with an empty query every item matches,
  // so the user sees the full set and can then type to narrow it. Kept in a ref
  // and connected imperatively so the closure never captures a stale
  // `disabled`/`setOpen`. A disabled combobox refuses to open; readOnly opens.
  const openOnFocusRef = React.useRef<() => void>();
  openOnFocusRef.current = () => {
    if (disabled) {
      return;
    }

    comboboxContext.setOpen(true);
  };

  const focusedConnectionRef = React.useRef<RBXScriptConnection>();
  const [editing, setEditing] = React.useState(false);

  // A focus node so the navigation controller can reach the field inside a
  // FocusScope (e.g. a Dialog). While the text is being edited, arrows belong to
  // the field (text cursor / list highlight), so the controller passes them through.
  const focusRef = React.useRef<GuiObject>();
  useFocusNode({
    ref: focusRef,
    disabled,
    getCapturesDirectional: () => editing,
  });

  const setInputRef = React.useCallback(
    (instance: Instance | undefined) => {
      const previousInput = comboboxContext.inputRef.current;
      const nextInput = toTextBox(instance);

      comboboxContext.inputRef.current = nextInput;
      focusRef.current = nextInput;

      focusedConnectionRef.current?.Disconnect();
      focusedConnectionRef.current = undefined;

      if (nextInput) {
        comboboxContext.anchorRef.current = nextInput;
        focusedConnectionRef.current = nextInput.Focused.Connect(() => {
          openOnFocusRef.current?.();
        });
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

  // Up/Down move the list highlight while the field keeps focus (the
  // active-descendant pattern); the first press opens a closed list. A focused
  // TextBox receives no InputBegan of its own (verified in Studio), so the keys
  // are read from UserInputService while this field is being edited. This moves
  // the highlight, not focus: focus stays in the field throughout.
  const moveHighlightRef = React.useRef(comboboxContext.moveHighlight);
  moveHighlightRef.current = comboboxContext.moveHighlight;
  React.useEffect(() => {
    if (!editing || disabled) {
      return;
    }

    const connection = UserInputService.InputBegan.Connect((inputObject) => {
      const input = comboboxContext.inputRef.current;
      if (input === undefined || UserInputService.GetFocusedTextBox() !== input) {
        return;
      }

      if (inputObject.KeyCode === Enum.KeyCode.Down) {
        moveHighlightRef.current(1);
      } else if (inputObject.KeyCode === Enum.KeyCode.Up) {
        moveHighlightRef.current(-1);
      }
    });

    return () => connection.Disconnect();
  }, [comboboxContext.inputRef, disabled, editing]);

  const handleFocused = React.useCallback(() => {
    setEditing(true);
  }, []);

  // Enter releases the TextBox; when it does, commit the highlighted item.
  const handleFocusLost = React.useCallback(
    (_rbx: TextBox, enterPressed: boolean) => {
      setEditing(false);
      if (enterPressed && !disabled) {
        comboboxContext.commitHighlight();
      }
    },
    [comboboxContext, disabled],
  );

  const passthrough = getPassthroughProps<TextBox>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    // Roblox clears a TextBox on focus by default, which would wipe the controlled query.
    ClearTextOnFocus: false,
    // Only when `placeholder` is given, so a passthrough or asChild `PlaceholderText` is not
    // overwritten with "" (behavior props spread last).
    ...(props.placeholder !== undefined ? { PlaceholderText: props.placeholder } : {}),
    Selectable: !disabled,
    Text: comboboxContext.inputValue,
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
      error("[ComboboxInput] `asChild` requires a child element.");
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
