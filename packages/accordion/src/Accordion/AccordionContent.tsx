import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { createSurfaceRevealRecipe, type PresenceMotionConfig, usePresenceMotion } from "@lattice-ui/motion";
import { useAccordionItemContext } from "./context";
import type { AccordionContentProps } from "./types";

function AccordionContentImpl(props: {
  motionPresent: boolean;
  visible: boolean;
  transition?: PresenceMotionConfig;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const defaultTransition = React.useMemo(() => createSurfaceRevealRecipe(), []);
  const config = props.transition ?? defaultTransition;

  const motionRef = usePresenceMotion<Frame>(props.motionPresent, config, props.onExitComplete);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[AccordionContent] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={props.visible} ref={motionRef}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(35, 41, 54)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(260, 44)}
      Visible={props.visible}
      ref={motionRef}
    >
      {props.children}
    </frame>
  );
}

export function AccordionContent(props: AccordionContentProps) {
  const itemContext = useAccordionItemContext();
  const forceMount = props.forceMount === true;

  if (forceMount) {
    return (
      <AccordionContentImpl
        asChild={props.asChild}
        motionPresent={itemContext.open}
        transition={props.transition}
        visible={itemContext.open}
      >
        {props.children}
      </AccordionContentImpl>
    );
  }

  return (
    <Presence
      present={itemContext.open}
      render={(state) => (
        <AccordionContentImpl
          asChild={props.asChild}
          motionPresent={state.isPresent}
          onExitComplete={state.onExitComplete}
          transition={props.transition}
          visible={true}
        >
          {props.children}
        </AccordionContentImpl>
      )}
    />
  );
}
