import { createStrictContext } from "@lattice-ui/core";
import type { RadioGroupContextValue, RadioGroupItemContextValue } from "./types";

const [RadioGroupContextProvider, useRadioGroupContext] = createStrictContext<RadioGroupContextValue>("RadioGroup");
const [RadioGroupItemContextProvider, useRadioGroupItemContext] =
  createStrictContext<RadioGroupItemContextValue>("RadioGroupItem");

export { RadioGroupContextProvider, RadioGroupItemContextProvider, useRadioGroupContext, useRadioGroupItemContext };
