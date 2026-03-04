import { ScrollAreaCorner } from "./ScrollArea/ScrollAreaCorner";
import { ScrollAreaRoot } from "./ScrollArea/ScrollAreaRoot";
import { ScrollAreaScrollbar } from "./ScrollArea/ScrollAreaScrollbar";
import { ScrollAreaThumb } from "./ScrollArea/ScrollAreaThumb";
import { ScrollAreaViewport } from "./ScrollArea/ScrollAreaViewport";

export const ScrollArea = {
  Root: ScrollAreaRoot,
  Viewport: ScrollAreaViewport,
  Scrollbar: ScrollAreaScrollbar,
  Thumb: ScrollAreaThumb,
  Corner: ScrollAreaCorner,
} as const;

export { resolveCanvasPositionFromThumbOffset, resolveThumbOffset, resolveThumbSize } from "./ScrollArea/scrollMath";
export type {
  ScrollAreaContextValue,
  ScrollAreaCornerProps,
  ScrollAreaOrientation,
  ScrollAreaProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollAreaType,
  ScrollAreaViewportProps,
  ScrollAxisMetrics,
} from "./ScrollArea/types";
