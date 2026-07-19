import { SliderRange } from "./Slider/SliderRange";
import { SliderRoot } from "./Slider/SliderRoot";
import { SliderThumb } from "./Slider/SliderThumb";
import { SliderTrack } from "./Slider/SliderTrack";

export const Slider = {
  Root: SliderRoot,
  Track: SliderTrack,
  Range: SliderRange,
  Thumb: SliderThumb,
} as const;

export type {
  SliderCommitValue,
  SliderContextValue,
  SliderOrientation,
  SliderProps,
  SliderRangeProps,
  SliderSetValue,
  SliderThumbProps,
  SliderTrackProps,
} from "./Slider/types";
