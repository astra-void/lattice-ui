import { createStrictContext } from "@lattice-ui/core";
import type { ToastContextValue } from "./types";

const [ToastContextProvider, useToastContext] = createStrictContext<ToastContextValue>("Toast");

export { ToastContextProvider, useToastContext };
