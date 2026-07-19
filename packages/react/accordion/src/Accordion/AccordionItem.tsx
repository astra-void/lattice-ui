import { getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { AccordionItemContextProvider, useAccordionContext } from "./context";
import type { AccordionItemProps } from "./types";

const OWN_PROPS = ["value", "disabled", "asChild", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `frame` renders an opaque grey box.
// Neutralize only that, and leave every real appearance decision to the consumer. Passthrough props
// are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

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

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[AccordionItem] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <AccordionItemContextProvider value={contextValue}>
        <Slot {...toSlotProps(passthrough)}>{child}</Slot>
      </AccordionItemContextProvider>
    );
  }

  return (
    <AccordionItemContextProvider value={contextValue}>
      <frame {...NEUTRAL_PROPS} {...passthrough}>
        {props.children}
      </frame>
    </AccordionItemContextProvider>
  );
}
