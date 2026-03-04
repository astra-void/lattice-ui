import { RadioGroupIndicator } from "./RadioGroup/RadioGroupIndicator";
import { RadioGroupItem } from "./RadioGroup/RadioGroupItem";
import { RadioGroupRoot } from "./RadioGroup/RadioGroupRoot";

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
}) as typeof RadioGroupRoot & {
  Root: typeof RadioGroupRoot;
  Item: typeof RadioGroupItem;
  Indicator: typeof RadioGroupIndicator;
};

export { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot };

export type {
  RadioGroupContextValue,
  RadioGroupIndicatorProps,
  RadioGroupItemContextValue,
  RadioGroupItemProps,
  RadioGroupProps,
  RadioGroupSetValue,
} from "./RadioGroup/types";
