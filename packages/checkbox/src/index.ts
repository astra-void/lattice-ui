import { CheckboxIndicator } from "./Checkbox/CheckboxIndicator";
import { CheckboxRoot } from "./Checkbox/CheckboxRoot";

export const Checkbox = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
}) as typeof CheckboxRoot & {
  Root: typeof CheckboxRoot;
  Indicator: typeof CheckboxIndicator;
};

export { CheckboxIndicator, CheckboxRoot };

export type { CheckboxContextValue, CheckboxIndicatorProps, CheckboxProps, CheckedState } from "./Checkbox/types";
