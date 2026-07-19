import { composeRefs, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useScrollAreaContext } from "./context";
import type { ScrollAreaViewportProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See the other ScrollArea parts: only the Roblox instance defaults are neutralized, never
// appearance. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

// Scrolling behavior, not decoration: the canvas is measured from its content, and the native
// scrollbar is suppressed because ScrollArea renders its own. Spread after the passthrough props so
// a consumer cannot break the measurement the scrollbars depend on.
const SCROLL_PROPS = {
  Active: true,
  AutomaticCanvasSize: Enum.AutomaticSize.XY,
  CanvasSize: UDim2.fromScale(0, 0),
  ScrollBarImageTransparency: 1,
  ScrollBarThickness: 0,
  ScrollingDirection: Enum.ScrollingDirection.XY,
};

function toScrollingFrame(instance: Instance | undefined) {
  if (!instance?.IsA("ScrollingFrame")) {
    return undefined;
  }

  return instance;
}

export function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  const scrollAreaContext = useScrollAreaContext();

  const { viewportRef, setViewport, setMetrics, notifyScrollActivity } = scrollAreaContext;

  const setViewportRef = React.useCallback(
    (instance: Instance | undefined) => {
      setViewport(toScrollingFrame(instance));
    },
    [setViewport],
  );

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateMetrics = () => {
      setMetrics({
        vertical: {
          viewportSize: viewport.AbsoluteWindowSize.Y,
          contentSize: viewport.AbsoluteCanvasSize.Y,
          scrollPosition: viewport.CanvasPosition.Y,
        },
        horizontal: {
          viewportSize: viewport.AbsoluteWindowSize.X,
          contentSize: viewport.AbsoluteCanvasSize.X,
          scrollPosition: viewport.CanvasPosition.X,
        },
      });
    };

    updateMetrics();

    const canvasConnection = viewport.GetPropertyChangedSignal("CanvasPosition").Connect(() => {
      updateMetrics();
      notifyScrollActivity();
    });

    const absoluteCanvasConnection = viewport.GetPropertyChangedSignal("AbsoluteCanvasSize").Connect(updateMetrics);
    const absoluteWindowConnection = viewport.GetPropertyChangedSignal("AbsoluteWindowSize").Connect(updateMetrics);

    return () => {
      canvasConnection.Disconnect();
      absoluteCanvasConnection.Disconnect();
      absoluteWindowConnection.Disconnect();
    };
  }, [viewportRef, setMetrics, notifyScrollActivity]);

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  // The viewport instance is measured for every scroll metric, so its ref must reach the root even
  // when the consumer forwards one of their own.
  const ref = composeRefs<ScrollingFrame>(passthrough.ref as never, setViewportRef);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ScrollAreaViewport] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...passthrough} {...SCROLL_PROPS} ref={ref as never}>
        {child}
      </Slot>
    );
  }

  return (
    <scrollingframe {...NEUTRAL_PROPS} {...passthrough} {...SCROLL_PROPS} ref={ref}>
      {props.children}
    </scrollingframe>
  );
}
