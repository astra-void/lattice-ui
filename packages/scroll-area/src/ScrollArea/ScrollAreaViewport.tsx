import { React, Slot } from "@lattice-ui/core";
import { useScrollAreaContext } from "./context";
import type { ScrollAreaViewportProps } from "./types";

function toScrollingFrame(instance: Instance | undefined) {
  if (!instance || !instance.IsA("ScrollingFrame")) {
    return undefined;
  }

  return instance;
}

export function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  const scrollAreaContext = useScrollAreaContext();

  const setViewportRef = React.useCallback(
    (instance: Instance | undefined) => {
      scrollAreaContext.setViewport(toScrollingFrame(instance));
    },
    [scrollAreaContext],
  );

  React.useEffect(() => {
    const viewport = scrollAreaContext.viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateMetrics = () => {
      scrollAreaContext.setMetrics({
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
      scrollAreaContext.notifyScrollActivity();
    });

    const absoluteCanvasConnection = viewport.GetPropertyChangedSignal("AbsoluteCanvasSize").Connect(updateMetrics);
    const absoluteWindowConnection = viewport.GetPropertyChangedSignal("AbsoluteWindowSize").Connect(updateMetrics);

    return () => {
      canvasConnection.Disconnect();
      absoluteCanvasConnection.Disconnect();
      absoluteWindowConnection.Disconnect();
    };
  }, [scrollAreaContext]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ScrollAreaViewport] `asChild` requires a child element.");
    }

    return (
      <Slot
        Active
        AutomaticCanvasSize={Enum.AutomaticSize.XY}
        CanvasSize={UDim2.fromScale(0, 0)}
        ScrollBarImageTransparency={1}
        ScrollBarThickness={0}
        ScrollingDirection={Enum.ScrollingDirection.XY}
        ref={setViewportRef}
      >
        {child}
      </Slot>
    );
  }

  return (
    <scrollingframe
      Active
      AutomaticCanvasSize={Enum.AutomaticSize.XY}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      CanvasSize={UDim2.fromScale(0, 0)}
      ScrollBarImageTransparency={1}
      ScrollBarThickness={0}
      ScrollingDirection={Enum.ScrollingDirection.XY}
      Size={UDim2.fromOffset(260, 160)}
      ref={setViewportRef}
    >
      {props.children}
    </scrollingframe>
  );
}
