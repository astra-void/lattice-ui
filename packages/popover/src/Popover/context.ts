import { createStrictContext } from "@lattice-ui/core";
import type { PopoverContextValue } from "./types";

const [PopoverContextProvider, usePopoverContext] = createStrictContext<PopoverContextValue>("Popover");

export { PopoverContextProvider, usePopoverContext };
