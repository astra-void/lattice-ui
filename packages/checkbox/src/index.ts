import { CheckboxIndicator } from "./Checkbox/CheckboxIndicator";
import { CheckboxRoot } from "./Checkbox/CheckboxRoot";

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
} as const satisfies {
  Root: typeof CheckboxRoot;
  Indicator: typeof CheckboxIndicator;
};

export type { CheckboxContextValue, CheckboxIndicatorProps, CheckboxProps, CheckedState } from "./Checkbox/types";
export { CheckboxIndicator, CheckboxRoot };
