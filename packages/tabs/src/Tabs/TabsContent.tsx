import { React, Slot } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";
import { useTabsContext } from "./context";
import { createTabsContentName } from "./internals/ids";
import type { TabsContentProps } from "./types";

type TabsContentImplProps = {
  visible: boolean;
  value: string;
  asChild?: boolean;
  children?: React.ReactNode;
};

function TabsContentImpl(props: TabsContentImplProps) {
  const contentName = createTabsContentName(props.value);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[TabsContent] `asChild` requires a child element.");
    }

    return (
      <Slot Name={contentName} Visible={props.visible}>
        {child}
      </Slot>
    );
  }

  return (
    <frame BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromOffset(0, 0)} Visible={props.visible}>
      {props.children}
    </frame>
  );
}

export function TabsContent(props: TabsContentProps) {
  const tabsContext = useTabsContext();
  const selected = tabsContext.value === props.value;
  const forceMount = props.forceMount === true;

  if (!selected && !forceMount) {
    return undefined;
  }

  if (forceMount) {
    return (
      <TabsContentImpl asChild={props.asChild} value={props.value} visible={selected}>
        {props.children}
      </TabsContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={0}
      present={selected}
      render={(state) => (
        <TabsContentImpl asChild={props.asChild} value={props.value} visible={state.isPresent}>
          {props.children}
        </TabsContentImpl>
      )}
    />
  );
}
