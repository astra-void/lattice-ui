import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useComboboxContext } from "./context";
import type { ComboboxValueProps } from "./types";

const OWN_PROPS = ["asChild", "placeholder", "children"] as const;

// See ComboboxTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function ComboboxValue(props: ComboboxValueProps) {
  const comboboxContext = useComboboxContext();
  const selectedValue = comboboxContext.value;
  const hasValue = selectedValue !== undefined;

  const resolvedText = React.useMemo(() => {
    if (!hasValue || selectedValue === undefined) {
      return props.placeholder ?? "";
    }

    return comboboxContext.getItemText(selectedValue) ?? selectedValue;
  }, [comboboxContext, hasValue, props.placeholder, selectedValue]);

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  // Rendering the selected label *is* this part's behavior, so `Text` is state-driven, not styling.
  const behaviorProps = {
    Text: resolvedText,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ComboboxValue] `asChild` requires a child element.");
    }

    return (
      <Slot Name="ComboboxValue" {...passthrough} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return <textlabel {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} />;
}
