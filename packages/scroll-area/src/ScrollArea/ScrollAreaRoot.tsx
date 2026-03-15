import { React } from "@lattice-ui/core";
import { ScrollAreaContextProvider } from "./context";
import type { ScrollAreaProps, ScrollAxisMetrics } from "./types";

function createAxisMetrics(): ScrollAxisMetrics {
  return {
    viewportSize: 0,
    contentSize: 0,
    scrollPosition: 0,
  };
}

export function ScrollAreaRoot(props: ScrollAreaProps) {
  const scrollType = props.type ?? "auto";
  const scrollHideDelayMs = math.max(0, props.scrollHideDelayMs ?? 600);

  const viewportRef = React.useRef<ScrollingFrame>();
  const [metrics, setMetrics] = React.useState(() => ({
    vertical: createAxisMetrics(),
    horizontal: createAxisMetrics(),
  }));
  const [showScrollbarsFromActivity, setShowScrollbarsFromActivity] = React.useState(scrollType !== "scroll");
  const activitySequenceRef = React.useRef(0);

  React.useEffect(() => {
    if (scrollType !== "scroll") {
      setShowScrollbarsFromActivity(true);
    }
  }, [scrollType]);

  const setViewport = React.useCallback((instance: ScrollingFrame | undefined) => {
    viewportRef.current = instance;
  }, []);

  const notifyScrollActivity = React.useCallback(() => {
    if (scrollType !== "scroll") {
      return;
    }

    activitySequenceRef.current += 1;
    const sequence = activitySequenceRef.current;

    setShowScrollbarsFromActivity(true);

    task.delay(scrollHideDelayMs / 1000, () => {
      if (sequence !== activitySequenceRef.current) {
        return;
      }

      setShowScrollbarsFromActivity(false);
    });
  }, [scrollHideDelayMs, scrollType]);

  const setScrollPosition = React.useCallback(
    (orientation: "vertical" | "horizontal", position: number) => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      const axisMetrics = orientation === "vertical" ? metrics.vertical : metrics.horizontal;
      const maxScroll = math.max(0, axisMetrics.contentSize - axisMetrics.viewportSize);
      const nextPosition = math.clamp(position, 0, maxScroll);

      viewport.CanvasPosition =
        orientation === "vertical"
          ? new Vector2(viewport.CanvasPosition.X, nextPosition)
          : new Vector2(nextPosition, viewport.CanvasPosition.Y);

      notifyScrollActivity();
    },
    [metrics.horizontal, metrics.vertical, notifyScrollActivity],
  );

  const hasVerticalOverflow = metrics.vertical.contentSize > metrics.vertical.viewportSize + 1;
  const hasHorizontalOverflow = metrics.horizontal.contentSize > metrics.horizontal.viewportSize + 1;

  const showVerticalScrollbar =
    scrollType === "always"
      ? hasVerticalOverflow
      : scrollType === "scroll"
        ? hasVerticalOverflow && showScrollbarsFromActivity
        : hasVerticalOverflow;

  const showHorizontalScrollbar =
    scrollType === "always"
      ? hasHorizontalOverflow
      : scrollType === "scroll"
        ? hasHorizontalOverflow && showScrollbarsFromActivity
        : hasHorizontalOverflow;

  const contextValue = React.useMemo(
    () => ({
      type: scrollType,
      scrollHideDelayMs,
      viewportRef,
      setViewport,
      vertical: metrics.vertical,
      horizontal: metrics.horizontal,
      setMetrics,
      setScrollPosition,
      notifyScrollActivity,
      showVerticalScrollbar,
      showHorizontalScrollbar,
    }),
    [
      metrics.horizontal,
      metrics.vertical,
      notifyScrollActivity,
      scrollHideDelayMs,
      setScrollPosition,
      setViewport,
      showHorizontalScrollbar,
      showVerticalScrollbar,
      scrollType,
    ],
  );

  return <ScrollAreaContextProvider value={contextValue}>{props.children}</ScrollAreaContextProvider>;
}

export { ScrollAreaRoot as ScrollArea };
