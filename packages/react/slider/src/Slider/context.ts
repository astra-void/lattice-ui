import { createStrictContext } from "@lattice-ui/react-runtime";
import type { SliderContextValue } from "./types";

const [SliderContextProvider, useSliderContext] = createStrictContext<SliderContextValue>("Slider");

export { SliderContextProvider, useSliderContext };
