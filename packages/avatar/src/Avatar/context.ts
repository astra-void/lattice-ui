import { createStrictContext } from "@lattice-ui/core";
import type { AvatarContextValue } from "./types";

const [AvatarContextProvider, useAvatarContext] = createStrictContext<AvatarContextValue>("Avatar");

export { AvatarContextProvider, useAvatarContext };
