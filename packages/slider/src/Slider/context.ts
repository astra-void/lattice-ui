import { createStrictContext } from "@lattice-ui/core";
import type { SliderContextValue } from "./types";

const [SliderContextProvider, useSliderContext] = createStrictContext<SliderContextValue>("Slider");

export { SliderContextProvider, useSliderContext };
