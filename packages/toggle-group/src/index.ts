import { ToggleGroupItem } from "./ToggleGroup/ToggleGroupItem";
import { ToggleGroupRoot } from "./ToggleGroup/ToggleGroupRoot";

export const ToggleGroup = {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
} as const;

export type {
  ToggleGroupCommonProps,
  ToggleGroupContextValue,
  ToggleGroupItemProps,
  ToggleGroupMultipleProps,
  ToggleGroupProps,
  ToggleGroupSingleProps,
  ToggleGroupType,
  ToggleGroupValue,
} from "./ToggleGroup/types";
