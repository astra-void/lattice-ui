import { useFocusNode } from "@lattice-ui/react-focus";
import {
  composeEvents,
  composeRefs,
  getPassthroughProps,
  getSlotChild,
  React,
  Slot,
  toSlotProps,
  useControllableState,
} from "@lattice-ui/react-runtime";
import { CheckboxContextProvider } from "./context";
import type { CheckboxProps, CheckedState } from "./types";

const OWN_PROPS = [
  "checked",
  "defaultChecked",
  "onCheckedChange",
  "disabled",
  "required",
  "asChild",
  "children",
] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, text) to the consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

function getNextCheckedState(checked: CheckedState) {
  if (checked === "indeterminate") {
    return true;
  }

  return !checked;
}

export function CheckboxRoot(props: CheckboxProps) {
  const [checked, setCheckedState] = useControllableState<CheckedState>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;
  const required = props.required === true;

  const setChecked = React.useCallback(
    (nextChecked: CheckedState) => {
      if (disabled) {
        return;
      }

      setCheckedState(nextChecked);
    },
    [disabled, setCheckedState],
  );

  const toggle = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setCheckedState(getNextCheckedState(checked));
  }, [checked, disabled, setCheckedState]);

  const contextValue = React.useMemo(
    () => ({
      checked,
      setChecked,
      disabled,
      required,
    }),
    [checked, disabled, required, setChecked],
  );

  // Registered so the navigation controller can reach the control inside a
  // FocusScope (a Dialog, a Popover); unregistered objects are invisible to
  // directional moves. Activation stays on the engine's `Activated`.
  const rootRef = React.useRef<GuiObject>();
  const setRootRef = React.useCallback((instance: Instance | undefined) => {
    rootRef.current = typeIs(instance, "Instance") && instance.IsA("GuiObject") ? instance : undefined;
  }, []);

  useFocusNode({
    ref: rootRef,
    disabled,
  });

  const child = props.children;
  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, { Activated: toggle }),
    Selectable: !disabled,
    ref: composeRefs<Instance>(passthrough.ref as never, setRootRef),
  };

  return (
    <CheckboxContextProvider value={contextValue}>
      {props.asChild ? (
        (() => {
          if (getSlotChild(child) === undefined) {
            error("[Checkbox] `asChild` requires a child element.");
          }

          // No neutral defaults here: the rendered element belongs to the consumer.
          return (
            <Slot {...toSlotProps(passthrough)} {...behaviorProps}>
              {child}
            </Slot>
          );
        })()
      ) : (
        <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
          {child}
        </textbutton>
      )}
    </CheckboxContextProvider>
  );
}
