import {
  composeEvents,
  getPassthroughProps,
  getSlotChild,
  React,
  Slot,
  toSlotProps,
  useControllableState,
} from "@lattice-ui/react-runtime";
import { SwitchContextProvider } from "./context";
import type { SwitchProps } from "./types";

const OWN_PROPS = ["checked", "defaultChecked", "onCheckedChange", "disabled", "asChild", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, text) to the consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function SwitchRoot(props: SwitchProps) {
  const [checked, setCheckedState] = useControllableState<boolean>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  });

  const disabled = props.disabled === true;

  const setChecked = React.useCallback(
    (nextChecked: boolean) => {
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
    setCheckedState(!checked);
  }, [checked, disabled, setCheckedState]);

  const contextValue = React.useMemo(
    () => ({
      checked,
      setChecked,
      disabled,
    }),
    [checked, disabled, setChecked],
  );

  const child = props.children;
  const passthrough = getPassthroughProps<TextButton>(props, OWN_PROPS);
  const behaviorProps = {
    Active: !disabled,
    Event: composeEvents(passthrough.Event, { Activated: toggle }),
    Selectable: !disabled,
  };

  return (
    <SwitchContextProvider value={contextValue}>
      {props.asChild ? (
        (() => {
          if (getSlotChild(child) === undefined) {
            error("[Switch] `asChild` requires a child element.");
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
    </SwitchContextProvider>
  );
}
