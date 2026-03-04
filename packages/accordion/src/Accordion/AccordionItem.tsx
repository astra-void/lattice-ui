import { React, Slot } from "@lattice-ui/core";
import { AccordionItemContextProvider, useAccordionContext } from "./context";
import type { AccordionItemProps } from "./types";

export function AccordionItem(props: AccordionItemProps) {
  const accordionContext = useAccordionContext();
  const open = accordionContext.openValues.includes(props.value);
  const disabled = props.disabled === true;

  const contextValue = React.useMemo(
    () => ({
      value: props.value,
      open,
      disabled,
    }),
    [disabled, open, props.value],
  );

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[AccordionItem] `asChild` requires a child element.");
    }

    return (
      <AccordionItemContextProvider value={contextValue}>
        <Slot>{child}</Slot>
      </AccordionItemContextProvider>
    );
  }

  return (
    <AccordionItemContextProvider value={contextValue}>
      <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(260, 80)}>
        {props.children}
      </frame>
    </AccordionItemContextProvider>
  );
}
