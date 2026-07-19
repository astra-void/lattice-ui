import { createStrictContext } from "@lattice-ui/react-runtime";
import type { DialogContextValue } from "./types";

const [DialogContextProvider, useDialogContext] = createStrictContext<DialogContextValue>("Dialog");

export { DialogContextProvider, useDialogContext };
