import { React } from "@lattice-ui/core";
import { getSelectedGuiObject, setSelectedGuiObject, UserInputService } from "../internals/guiSelection";
import { RovingFocusProvider } from "./context";
import { getFirstEnabledRovingIndex, getLastEnabledRovingIndex, getNextRovingIndex } from "./roving";
import type { RovingDirection, RovingFocusGroupProps, RovingItemRegistration, RovingOrientation } from "./types";

function findCurrentIndex(items: Array<RovingItemRegistration>, selectedObject: GuiObject | undefined) {
  if (!selectedObject) {
    return -1;
  }

  return items.findIndex((item) => {
    const node = item.getNode();
    if (!node) {
      return false;
    }

    return selectedObject === node || selectedObject.IsDescendantOf(node);
  });
}

function isItemDisabled(items: Array<RovingItemRegistration>, index: number) {
  const item = items[index];
  if (!item) {
    return true;
  }

  return item.getDisabled();
}

function focusItem(items: Array<RovingItemRegistration>, index: number) {
  const item = items[index];
  if (!item) {
    return;
  }

  if (item.getDisabled()) {
    return;
  }

  const node = item.getNode();
  if (!node || !node.Selectable) {
    return;
  }

  setSelectedGuiObject(node);
}

function resolveArrowDirection(keyCode: Enum.KeyCode, orientation: RovingOrientation): RovingDirection | undefined {
  if ((orientation === "vertical" || orientation === "both") && keyCode === Enum.KeyCode.Up) {
    return "prev";
  }

  if ((orientation === "vertical" || orientation === "both") && keyCode === Enum.KeyCode.Down) {
    return "next";
  }

  if ((orientation === "horizontal" || orientation === "both") && keyCode === Enum.KeyCode.Left) {
    return "prev";
  }

  if ((orientation === "horizontal" || orientation === "both") && keyCode === Enum.KeyCode.Right) {
    return "next";
  }

  return undefined;
}

export function RovingFocusGroup(props: RovingFocusGroupProps) {
  const loop = props.loop ?? true;
  const orientation = props.orientation ?? "both";
  const active = props.active ?? true;
  const autoFocus = props.autoFocus ?? "none";

  const itemEntriesRef = React.useRef<Array<RovingItemRegistration>>([]);
  const [revision, setRevision] = React.useState(0);

  const registerItem = React.useCallback((item: RovingItemRegistration) => {
    itemEntriesRef.current.push(item);
    setRevision((value) => value + 1);

    return () => {
      const index = itemEntriesRef.current.findIndex((entry) => entry.id === item.id);
      if (index >= 0) {
        itemEntriesRef.current.remove(index);
        setRevision((value) => value + 1);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!active || autoFocus !== "first") {
      return;
    }

    const items = itemEntriesRef.current;
    const firstEnabledIndex = getFirstEnabledRovingIndex(items.size(), (index) => isItemDisabled(items, index));
    if (firstEnabledIndex >= 0) {
      focusItem(items, firstEnabledIndex);
    }
  }, [active, autoFocus, revision]);

  React.useEffect(() => {
    if (!active) {
      return;
    }

    const connection = UserInputService.InputBegan.Connect((inputObject, gameProcessedEvent) => {
      if (gameProcessedEvent) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      const isHomeKey = keyCode === Enum.KeyCode.Home;
      const isEndKey = keyCode === Enum.KeyCode.End;
      const direction = resolveArrowDirection(keyCode, orientation);
      if (!isHomeKey && !isEndKey && !direction) {
        return;
      }

      const items = itemEntriesRef.current;
      const itemCount = items.size();
      if (itemCount <= 0) {
        return;
      }

      const selectedObject = getSelectedGuiObject();
      const currentIndex = findCurrentIndex(items, selectedObject);
      if (currentIndex < 0) {
        return;
      }

      if (isHomeKey) {
        const firstEnabledIndex = getFirstEnabledRovingIndex(itemCount, (index) => isItemDisabled(items, index));
        if (firstEnabledIndex >= 0) {
          focusItem(items, firstEnabledIndex);
        }
        return;
      }

      if (isEndKey) {
        const lastEnabledIndex = getLastEnabledRovingIndex(itemCount, (index) => isItemDisabled(items, index));
        if (lastEnabledIndex >= 0) {
          focusItem(items, lastEnabledIndex);
        }
        return;
      }

      if (!direction) {
        return;
      }

      const nextIndex = getNextRovingIndex(currentIndex, itemCount, direction, loop, (index) =>
        isItemDisabled(items, index),
      );
      if (nextIndex >= 0) {
        focusItem(items, nextIndex);
      }
    });

    return () => {
      connection.Disconnect();
    };
  }, [active, loop, orientation]);

  const contextValue = React.useMemo(
    () => ({
      registerItem,
    }),
    [registerItem],
  );

  return <RovingFocusProvider value={contextValue}>{props.children}</RovingFocusProvider>;
}
