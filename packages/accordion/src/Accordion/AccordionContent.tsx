import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import type { MotionConfig } from "@lattice-ui/motion";
import { useStateMotion } from "@lattice-ui/motion";
import { useAccordionItemContext } from "./context";
import type { AccordionContentProps } from "./types";

const CONTENT_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const CONTENT_EXIT_TWEEN_INFO = new TweenInfo(0.09, Enum.EasingStyle.Quad, Enum.EasingDirection.In);
const CONTENT_OFFSET = 4;

function buildAccordionContentTransition(): MotionConfig {
  return {
    entering: {
      tweenInfo: CONTENT_TWEEN_INFO,
      initial: {
        Position: UDim2.fromOffset(0, CONTENT_OFFSET),
      },
      goals: {
        Position: UDim2.fromOffset(0, 0),
      },
    },
    exiting: {
      tweenInfo: CONTENT_EXIT_TWEEN_INFO,
      goals: {
        Position: UDim2.fromOffset(0, CONTENT_OFFSET),
      },
    },
  };
}

function AccordionContentImpl(props: {
  visible: boolean;
  transition?: MotionConfig | false;
  onExitComplete?: () => void;
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  const contentRef = React.useRef<Frame>();

  const __motionRef = useStateMotion<Frame>(props.visible, props.transition || {}, false);
  React.useLayoutEffect(() => {
    if (__motionRef.current && contentRef.current !== __motionRef.current) {
      contentRef.current = __motionRef.current;
    }
  }, [__motionRef]);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[AccordionContent] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={props.visible} ref={contentRef}>
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
      ref={contentRef}
    >
      {props.children}
    </frame>
  );
}

export function AccordionContent(props: AccordionContentProps) {
  const itemContext = useAccordionItemContext();
  const forceMount = props.forceMount === true;

  const transition = React.useMemo(() => {
    return buildAccordionContentTransition();
  }, [props.transition]);

  if (forceMount) {
    return (
      <AccordionContentImpl asChild={props.asChild} transition={transition} visible={itemContext.open}>
        {props.children}
      </AccordionContentImpl>
    );
  }

  const exitFallbackMs = 0;

  return (
    <Presence
      exitFallbackMs={exitFallbackMs}
      present={itemContext.open}
      render={(state) => (
        <AccordionContentImpl
          asChild={props.asChild}
          onExitComplete={state.onExitComplete}
          transition={transition}
          visible={true}
        >
          {props.children}
        </AccordionContentImpl>
      )}
    />
  );
}
