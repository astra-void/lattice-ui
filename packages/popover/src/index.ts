import { PopoverAnchor } from "./Popover/PopoverAnchor";
import { PopoverClose } from "./Popover/PopoverClose";
import { PopoverContent } from "./Popover/PopoverContent";
import { PopoverPortal } from "./Popover/PopoverPortal";
import { Popover as PopoverRoot } from "./Popover/PopoverRoot";
import { PopoverTrigger } from "./Popover/PopoverTrigger";

export const Popover = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Portal: PopoverPortal,
  Content: PopoverContent,
  Anchor: PopoverAnchor,
  Close: PopoverClose,
}) as typeof PopoverRoot & {
  Root: typeof PopoverRoot;
  Trigger: typeof PopoverTrigger;
  Portal: typeof PopoverPortal;
  Content: typeof PopoverContent;
  Anchor: typeof PopoverAnchor;
  Close: typeof PopoverClose;
};

export { PopoverAnchor, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger };

export type {
  PopoverAnchorProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverPortalProps,
  PopoverProps,
  PopoverTriggerProps,
} from "./Popover/types";
