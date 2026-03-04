import { MenuContent } from "./Menu/MenuContent";
import { MenuGroup } from "./Menu/MenuGroup";
import { MenuItem } from "./Menu/MenuItem";
import { MenuLabel } from "./Menu/MenuLabel";
import { MenuPortal } from "./Menu/MenuPortal";
import { Menu as MenuRoot } from "./Menu/MenuRoot";
import { MenuSeparator } from "./Menu/MenuSeparator";
import { MenuTrigger } from "./Menu/MenuTrigger";

export const Menu = {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Portal: MenuPortal,
  Content: MenuContent,
  Item: MenuItem,
  Group: MenuGroup,
  Label: MenuLabel,
  Separator: MenuSeparator,
} as const satisfies {
  Root: typeof MenuRoot;
  Trigger: typeof MenuTrigger;
  Portal: typeof MenuPortal;
  Content: typeof MenuContent;
  Item: typeof MenuItem;
  Group: typeof MenuGroup;
  Label: typeof MenuLabel;
  Separator: typeof MenuSeparator;
};

export { MenuContent, MenuGroup, MenuItem, MenuLabel, MenuPortal, MenuRoot, MenuSeparator, MenuTrigger };

export type {
  MenuContentProps,
  MenuGroupProps,
  MenuItemProps,
  MenuLabelProps,
  MenuPortalProps,
  MenuProps,
  MenuSelectEvent,
  MenuSeparatorProps,
  MenuTriggerProps,
} from "./Menu/types";
