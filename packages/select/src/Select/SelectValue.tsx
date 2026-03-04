import { React, Slot } from "@lattice-ui/core";
import { useSelectContext } from "./context";
import type { SelectValueProps } from "./types";

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

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SelectValue] `asChild` requires a child element.");
    }

    return (
      <Slot Name="SelectValue" Text={resolvedText}>
        {child}
      </Slot>
    );
  }

  return (
    <textlabel
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(200, 20)}
      Text={resolvedText}
      TextColor3={hasValue ? Color3.fromRGB(235, 240, 248) : Color3.fromRGB(153, 161, 177)}
      TextSize={14}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}
