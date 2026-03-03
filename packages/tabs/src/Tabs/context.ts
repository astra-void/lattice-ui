import { createStrictContext } from "@lattice-ui/core";
import type { TabsContextValue } from "./types";

const [TabsContextProvider, useTabsContext] = createStrictContext<TabsContextValue>("Tabs");

export { TabsContextProvider, useTabsContext };
