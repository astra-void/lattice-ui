import { SelectContent } from "./Select/SelectContent";
import { SelectGroup } from "./Select/SelectGroup";
import { SelectItem } from "./Select/SelectItem";
import { SelectLabel } from "./Select/SelectLabel";
import { SelectPortal } from "./Select/SelectPortal";
import { SelectRoot } from "./Select/SelectRoot";
import { SelectSeparator } from "./Select/SelectSeparator";
import { SelectTrigger } from "./Select/SelectTrigger";
import { SelectValue } from "./Select/SelectValue";

export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Portal: SelectPortal,
  Content: SelectContent,
  Item: SelectItem,
  Group: SelectGroup,
  Label: SelectLabel,
  Separator: SelectSeparator,
} as const satisfies {
  Root: typeof SelectRoot;
  Trigger: typeof SelectTrigger;
  Value: typeof SelectValue;
  Portal: typeof SelectPortal;
  Content: typeof SelectContent;
  Item: typeof SelectItem;
  Group: typeof SelectGroup;
  Label: typeof SelectLabel;
  Separator: typeof SelectSeparator;
};

export type {
  SelectContentProps,
  SelectContextValue,
  SelectGroupProps,
  SelectItemProps,
  SelectItemRegistration,
  SelectLabelProps,
  SelectPortalProps,
  SelectProps,
  SelectSeparatorProps,
  SelectSetOpen,
  SelectSetValue,
  SelectTriggerProps,
  SelectValueProps,
} from "./Select/types";
export {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
