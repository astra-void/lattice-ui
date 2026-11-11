import { ToggleGroupItem } from "./ToggleGroup/ToggleGroupItem";
import { ToggleGroupRoot } from "./ToggleGroup/ToggleGroupRoot";

export const ToggleGroup = {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
} as const;

export { useToggleGroupItemContext } from "./ToggleGroup/context";
export type {
  ToggleGroupCommonProps,
  ToggleGroupContextValue,
  ToggleGroupItemContextValue,
  ToggleGroupItemProps,
  ToggleGroupItemRegistration,
  ToggleGroupMultipleProps,
  ToggleGroupOrientation,
  ToggleGroupProps,
  ToggleGroupSingleProps,
  ToggleGroupType,
  ToggleGroupValue,
} from "./ToggleGroup/types";
