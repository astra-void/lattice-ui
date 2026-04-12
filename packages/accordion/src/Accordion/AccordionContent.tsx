import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { createSurfaceRevealRecipe, type PresenceMotionConfig, usePresenceMotionController } from "@lattice-ui/motion";
import { useAccordionItemContext } from "./context";
import type { AccordionContentProps } from "./types";

function AccordionContentImpl(props: {
  present: boolean;
  forceMount?: boolean;
  transition?: PresenceMotionConfig;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const defaultTransition = React.useMemo(() => createSurfaceRevealRecipe(), []);
  const config = props.transition ?? defaultTransition;

  const motion = usePresenceMotionController<Frame>({
    present: props.present,
    forceMount: props.forceMount,
    config,
    onExitComplete: props.onExitComplete,
  });

  const mounted = motion.mounted;
  const visible = mounted && (motion.present || motion.phase !== "exited");

  if (!mounted) {
    return undefined;
  }

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[AccordionContent] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={visible} ref={motion.ref}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(35, 41, 54)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(260, 44)}
      Visible={visible}
      ref={motion.ref}
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
        forceMount={true}
        present={itemContext.open}
        transition={props.transition}
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
          onExitComplete={state.onExitComplete}
          present={state.isPresent}
          transition={props.transition}
        >
          {props.children}
        </AccordionContentImpl>
      )}
    />
  );
}
