import { TabsContent } from "./Tabs/TabsContent";
import { TabsList } from "./Tabs/TabsList";
import { TabsRoot } from "./Tabs/TabsRoot";
import { TabsTrigger } from "./Tabs/TabsTrigger";

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
} as const;

export type {
  TabsContentProps,
  TabsContextValue,
  TabsListProps,
  TabsProps,
  TabsTriggerProps,
} from "./Tabs/types";
