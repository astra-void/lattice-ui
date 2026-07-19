import { createStrictContext } from "@lattice-ui/react-runtime";
import type { PopoverContextValue } from "./types";

const [PopoverContextProvider, usePopoverContext] = createStrictContext<PopoverContextValue>("Popover");

export { PopoverContextProvider, usePopoverContext };
