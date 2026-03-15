import type React from "@rbxts/react";

export type ScrollAreaType = "auto" | "always" | "scroll";
export type ScrollAreaOrientation = "vertical" | "horizontal";

export type ScrollAxisMetrics = {
  viewportSize: number;
  contentSize: number;
  scrollPosition: number;
};

export type ScrollAreaContextValue = {
  type: ScrollAreaType;
  scrollHideDelayMs: number;
  viewportRef: React.MutableRefObject<ScrollingFrame | undefined>;
  setViewport: (instance: ScrollingFrame | undefined) => void;
  vertical: ScrollAxisMetrics;
  horizontal: ScrollAxisMetrics;
  setMetrics: (metrics: { vertical: ScrollAxisMetrics; horizontal: ScrollAxisMetrics }) => void;
  setScrollPosition: (orientation: ScrollAreaOrientation, position: number) => void;
  notifyScrollActivity: () => void;
  showVerticalScrollbar: boolean;
  showHorizontalScrollbar: boolean;
};

export type ScrollAreaProps = {
  type?: ScrollAreaType;
  scrollHideDelayMs?: number;
  children?: React.ReactNode;
};

export type ScrollAreaViewportProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ScrollAreaScrollbarProps = {
  orientation: ScrollAreaOrientation;
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ScrollAreaThumbProps = {
  orientation: ScrollAreaOrientation;
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ScrollAreaCornerProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
