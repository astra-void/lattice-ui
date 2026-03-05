import { React, useControllableState } from "@lattice-ui/core";
import { RovingFocusGroup } from "@lattice-ui/focus";
import { AccordionContextProvider } from "./context";
import { nextAccordionValues, normalizeAccordionValue } from "./state";
import type { AccordionProps } from "./types";

export function AccordionRoot(props: AccordionProps) {
  const accordionType = props.type ?? "single";
  const loop = props.loop ?? true;
  const keyboardNavigation = props.keyboardNavigation === true;
  const collapsible = props.collapsible ?? false;

  const defaultValue = props.defaultValue ?? (accordionType === "single" ? "" : []);

  const [rawValue, setRawValue] = useControllableState<string | Array<string>>({
    value: props.value,
    defaultValue,
    onChange: props.onValueChange,
  });

  const openValues = normalizeAccordionValue(accordionType, rawValue);

  const toggleItem = React.useCallback(
    (candidateValue: string) => {
      const nextValues = nextAccordionValues(accordionType, openValues, candidateValue, collapsible);
      if (accordionType === "single") {
        setRawValue(nextValues[0] ?? "");
        return;
      }

      setRawValue(nextValues);
    },
    [accordionType, collapsible, openValues, setRawValue],
  );

  const contextValue = React.useMemo(
    () => ({
      type: accordionType,
      openValues,
      loop,
      toggleItem,
    }),
    [accordionType, loop, openValues, toggleItem],
  );

  return (
    <AccordionContextProvider value={contextValue}>
      <RovingFocusGroup active={keyboardNavigation} autoFocus="none" loop={loop} orientation="vertical">
        {props.children}
      </RovingFocusGroup>
    </AccordionContextProvider>
  );
}

export { AccordionRoot as Accordion };
