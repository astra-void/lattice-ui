import { SwitchRoot } from "./Switch/SwitchRoot";
import { SwitchThumb } from "./Switch/SwitchThumb";

export const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
} as const;

export type { SwitchContextValue, SwitchProps, SwitchThumbProps, SwitchTrackColorMode } from "./Switch/types";
