import { ContextMenuContent } from "./ContextMenu/ContextMenuContent";
import { ContextMenuGroup } from "./ContextMenu/ContextMenuGroup";
import { ContextMenuItem } from "./ContextMenu/ContextMenuItem";
import { ContextMenuLabel } from "./ContextMenu/ContextMenuLabel";
import { ContextMenuPortal } from "./ContextMenu/ContextMenuPortal";
import { ContextMenu as ContextMenuRoot } from "./ContextMenu/ContextMenuRoot";
import { ContextMenuSeparator } from "./ContextMenu/ContextMenuSeparator";
import { ContextMenuTrigger } from "./ContextMenu/ContextMenuTrigger";

export const ContextMenu = {
  Root: ContextMenuRoot,
  Trigger: ContextMenuTrigger,
  Portal: ContextMenuPortal,
  Content: ContextMenuContent,
  Item: ContextMenuItem,
  Group: ContextMenuGroup,
  Label: ContextMenuLabel,
  Separator: ContextMenuSeparator,
} as const satisfies {
  Root: typeof ContextMenuRoot;
  Trigger: typeof ContextMenuTrigger;
  Portal: typeof ContextMenuPortal;
  Content: typeof ContextMenuContent;
  Item: typeof ContextMenuItem;
  Group: typeof ContextMenuGroup;
  Label: typeof ContextMenuLabel;
  Separator: typeof ContextMenuSeparator;
};

export { useContextMenuItemContext } from "./ContextMenu/context";
export type {
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemContextValue,
  ContextMenuItemProps,
  ContextMenuLabelProps,
  ContextMenuPortalProps,
  ContextMenuProps,
  ContextMenuSelectEvent,
  ContextMenuSeparatorProps,
  ContextMenuTriggerProps,
} from "./ContextMenu/types";
export {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
};
