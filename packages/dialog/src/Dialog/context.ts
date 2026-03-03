import { createStrictContext } from "@lattice-ui/core";
import type { DialogContextValue } from "./types";

const [DialogContextProvider, useDialogContext] = createStrictContext<DialogContextValue>("Dialog");

export { DialogContextProvider, useDialogContext };
