import { React, Slot } from "@lattice-ui/core";
import { useRovingFocusContext } from "./context";
import type { RovingFocusItemProps } from "./types";

let nextRovingItemId = 0;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function RovingFocusItem(props: RovingFocusItemProps) {
  const rovingFocusContext = useRovingFocusContext();
  const navigationEnabled = rovingFocusContext.navigationEnabled;
  const itemRef = React.useRef<GuiObject>();
  const disabledRef = React.useRef(props.disabled === true);

  React.useEffect(() => {
    disabledRef.current = props.disabled === true;
  }, [props.disabled]);

  const itemIdRef = React.useRef(0);
  if (itemIdRef.current === 0) {
    nextRovingItemId += 1;
    itemIdRef.current = nextRovingItemId;
  }

  React.useEffect(() => {
    return rovingFocusContext.registerItem({
      id: itemIdRef.current,
      getNode: () => itemRef.current,
      getDisabled: () => disabledRef.current,
    });
  }, [rovingFocusContext]);

  const setItemRef = React.useCallback((instance: Instance | undefined) => {
    itemRef.current = toGuiObject(instance);
  }, []);

  React.useEffect(() => {
    const node = itemRef.current;
    if (!node) {
      return;
    }

    node.Selectable = navigationEnabled && props.disabled !== true;
  });

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[RovingFocusItem] `asChild` requires a child element.");
    }

    return (
      <Slot Active={props.disabled !== true} Selectable={navigationEnabled && props.disabled !== true} ref={setItemRef}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={props.disabled !== true}
      AutoButtonColor={false}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Selectable={navigationEnabled && props.disabled !== true}
      Size={UDim2.fromOffset(140, 30)}
      Text="Item"
      TextColor3={Color3.fromRGB(240, 244, 250)}
      TextSize={15}
      ref={setItemRef}
    >
      {props.children}
    </textbutton>
  );
}
