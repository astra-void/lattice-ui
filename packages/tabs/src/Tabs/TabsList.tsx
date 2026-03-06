import { React, Slot } from "@lattice-ui/core";
import { RovingFocusGroup } from "@lattice-ui/focus";
import { useTabsContext } from "./context";
import type { TabsListProps } from "./types";

export function TabsList(props: TabsListProps) {
  const tabsContext = useTabsContext();

  const listNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[TabsList] `asChild` requires a child element.");
      }

      return <Slot>{child}</Slot>;
    })()
  ) : (
    <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(0, 0)}>
      {props.children}
    </frame>
  );

  return (
    <RovingFocusGroup
      active={tabsContext.keyboardNavigation}
      autoFocus="none"
      loop
      orientation={tabsContext.orientation}
    >
      {listNode}
    </RovingFocusGroup>
  );
}
