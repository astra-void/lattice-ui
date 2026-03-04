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
  ToggleGroupOrientation,
  ToggleGroupProps,
  ToggleGroupSingleProps,
  ToggleGroupType,
  ToggleGroupValue,
} from "./ToggleGroup/types";
