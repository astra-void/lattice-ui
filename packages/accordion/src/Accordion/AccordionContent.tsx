import { React, Slot } from "@lattice-ui/core";
import { useAccordionItemContext } from "./context";
import type { AccordionContentProps } from "./types";

export function AccordionContent(props: AccordionContentProps) {
  const itemContext = useAccordionItemContext();
  const forceMount = props.forceMount === true;

  if (!itemContext.open && !forceMount) {
    return undefined;
  }

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[AccordionContent] `asChild` requires a child element.");
    }

    return <Slot Visible={itemContext.open}>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(35, 41, 54)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(260, 44)}
      Visible={itemContext.open}
    >
      {props.children}
    </frame>
  );
}
