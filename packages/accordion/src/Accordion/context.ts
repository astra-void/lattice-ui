import { createStrictContext } from "@lattice-ui/core";
import type { AccordionContextValue, AccordionItemContextValue } from "./types";

const [AccordionContextProvider, useAccordionContext] = createStrictContext<AccordionContextValue>("Accordion");
const [AccordionItemContextProvider, useAccordionItemContext] =
  createStrictContext<AccordionItemContextValue>("AccordionItem");

export { AccordionContextProvider, AccordionItemContextProvider, useAccordionContext, useAccordionItemContext };
