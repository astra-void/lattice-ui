import { TooltipContent } from "./Tooltip/TooltipContent";
import { TooltipPortal } from "./Tooltip/TooltipPortal";
import { TooltipProvider } from "./Tooltip/TooltipProvider";
import { Tooltip as TooltipRoot } from "./Tooltip/TooltipRoot";
import { TooltipTrigger } from "./Tooltip/TooltipTrigger";

export const Tooltip = {
  Provider: TooltipProvider,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Content: TooltipContent,
} as const;

export type {
  TooltipContentProps,
  TooltipPortalProps,
  TooltipProps,
  TooltipProviderProps,
  TooltipTriggerProps,
} from "./Tooltip/types";
