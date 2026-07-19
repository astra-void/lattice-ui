import { getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useSelectContext } from "./context";
import type { SelectValueProps } from "./types";

const OWN_PROPS = ["asChild", "placeholder", "children"] as const;

// See SelectTrigger: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

export function SelectValue(props: SelectValueProps) {
  const selectContext = useSelectContext();
  const selectedValue = selectContext.value;
  const hasValue = selectedValue !== undefined;

  const resolvedText = React.useMemo(() => {
    if (!hasValue || selectedValue === undefined) {
      return props.placeholder ?? "";
    }

    return selectContext.getItemText(selectedValue) ?? selectedValue;
  }, [hasValue, props.placeholder, selectContext, selectedValue]);

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  // Rendering the selected label *is* this part's behavior, so `Text` is state-driven, not styling.
  const behaviorProps = {
    Text: resolvedText,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectValue] `asChild` requires a child element.");
    }

    return (
      <Slot Name="SelectValue" {...passthrough} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return <textlabel {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} />;
}
