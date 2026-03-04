import { ComboboxContent } from "./Combobox/ComboboxContent";
import { ComboboxGroup } from "./Combobox/ComboboxGroup";
import { ComboboxInput } from "./Combobox/ComboboxInput";
import { ComboboxItem } from "./Combobox/ComboboxItem";
import { ComboboxLabel } from "./Combobox/ComboboxLabel";
import { ComboboxPortal } from "./Combobox/ComboboxPortal";
import { ComboboxRoot } from "./Combobox/ComboboxRoot";
import { ComboboxSeparator } from "./Combobox/ComboboxSeparator";
import { ComboboxTrigger } from "./Combobox/ComboboxTrigger";
import { ComboboxValue } from "./Combobox/ComboboxValue";

export const Combobox = {
  Root: ComboboxRoot,
  Trigger: ComboboxTrigger,
  Input: ComboboxInput,
  Value: ComboboxValue,
  Portal: ComboboxPortal,
  Content: ComboboxContent,
  Item: ComboboxItem,
  Group: ComboboxGroup,
  Label: ComboboxLabel,
  Separator: ComboboxSeparator,
} as const;

export {
  defaultComboboxFilter,
  filterComboboxOptions,
  resolveComboboxInputValue,
  resolveForcedComboboxValue,
} from "./Combobox/logic";
export type {
  ComboboxContentProps,
  ComboboxContextValue,
  ComboboxFilterFn,
  ComboboxGroupProps,
  ComboboxInputProps,
  ComboboxItemProps,
  ComboboxItemRegistration,
  ComboboxLabelProps,
  ComboboxPortalProps,
  ComboboxProps,
  ComboboxSeparatorProps,
  ComboboxSetInputValue,
  ComboboxSetOpen,
  ComboboxSetValue,
  ComboboxTriggerProps,
  ComboboxValueProps,
} from "./Combobox/types";
