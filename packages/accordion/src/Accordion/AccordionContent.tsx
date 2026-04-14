import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { createSurfaceRevealRecipe, usePresenceMotionController } from "@lattice-ui/motion";
import { useAccordionItemContext } from "./context";
import type { AccordionContentProps } from "./types";

type GuiPropBag = React.Attributes & Record<string, unknown>;

type AccordionContentImplProps = AccordionContentProps & {
  present: boolean;
  onExitComplete?: () => void;
};

function getImplRestProps(props: AccordionContentImplProps): GuiPropBag {
  const restProps: GuiPropBag = {};

  for (const [rawKey, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    if (
      rawKey === "present" ||
      rawKey === "forceMount" ||
      rawKey === "transition" ||
      rawKey === "onExitComplete" ||
      rawKey === "asChild" ||
      rawKey === "children"
    ) {
      continue;
    }

    restProps[rawKey] = value;
  }

  return restProps;
}

function getContentRestProps(props: AccordionContentProps): GuiPropBag {
  const restProps: GuiPropBag = {};

  for (const [rawKey, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    if (rawKey === "asChild" || rawKey === "forceMount" || rawKey === "transition" || rawKey === "children") {
      continue;
    }

    restProps[rawKey] = value;
  }

  return restProps;
}

function AccordionContentImpl(props: AccordionContentImplProps) {
  const present = props.present;
  const forceMount = props.forceMount;
  const transition = props.transition;
  const onExitComplete = props.onExitComplete;
  const asChild = props.asChild;
  const children = props.children;
  const restProps = getImplRestProps(props);

  const defaultTransition = React.useMemo(() => createSurfaceRevealRecipe(), []);
  const config = transition ?? defaultTransition;

  const motion = usePresenceMotionController<Frame>({
    present,
    forceMount,
    config,
    onExitComplete,
  });

  const mounted = motion.mounted;
  const visible = mounted && (motion.present || motion.phase !== "exited");

  if (!mounted) {
    return undefined;
  }

  if (asChild) {
    const child = children;
    if (React.Children.count(children) !== 1 || !React.isValidElement(child)) {
      error("[AccordionContent] `asChild` requires a single child element.");
    }

    return (
      <Slot {...restProps} Visible={visible} ref={motion.ref}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(35, 41, 54)}
      BorderSizePixel={0}
      {...restProps}
      Visible={visible}
      ref={motion.ref}
    >
      {children}
    </frame>
  );
}

export function AccordionContent(props: AccordionContentProps) {
  const itemContext = useAccordionItemContext();
  const asChild = props.asChild;
  const forceMount = props.forceMount;
  const transition = props.transition;
  const children = props.children;
  const restProps = getContentRestProps(props);

  const shouldForceMount = forceMount === true;

  if (shouldForceMount) {
    return (
      <AccordionContentImpl
        {...restProps}
        asChild={asChild}
        forceMount={true}
        present={itemContext.open}
        transition={transition}
      >
        {children}
      </AccordionContentImpl>
    );
  }

  return (
    <Presence
      present={itemContext.open}
      render={(state) => (
        <AccordionContentImpl
          {...restProps}
          asChild={asChild}
          onExitComplete={state.onExitComplete}
          present={state.isPresent}
          transition={transition}
        >
          {children}
        </AccordionContentImpl>
      )}
    />
  );
}
