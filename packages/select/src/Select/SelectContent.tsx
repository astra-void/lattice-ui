import { React, Slot } from "@lattice-ui/core";
import { RovingFocusGroup } from "@lattice-ui/focus";
import { DismissableLayer, Presence } from "@lattice-ui/layer";
import { usePopper } from "@lattice-ui/popper";
import { useSelectContext } from "./context";
import type { SelectContentProps, SelectItemRegistration } from "./types";

const GuiService = game.GetService("GuiService");
const UserInputService = game.GetService("UserInputService");

const digitKeyMap: Record<string, string> = {
  Zero: "0",
  One: "1",
  Two: "2",
  Three: "3",
  Four: "4",
  Five: "5",
  Six: "6",
  Seven: "7",
  Eight: "8",
  Nine: "9",
};

type SelectContentImplProps = {
  enabled: boolean;
  visible: boolean;
  onDismiss: () => void;
  asChild?: boolean;
  placement?: SelectContentProps["placement"];
  offset?: SelectContentProps["offset"];
  padding?: SelectContentProps["padding"];
} & Pick<SelectContentProps, "children" | "onEscapeKeyDown" | "onInteractOutside" | "onPointerDownOutside">;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function toSearchCharacter(keyCode: Enum.KeyCode) {
  if (keyCode === Enum.KeyCode.Space) {
    return " ";
  }

  const digitCharacter = digitKeyMap[keyCode.Name];
  if (digitCharacter !== undefined) {
    return digitCharacter;
  }

  if (keyCode.Name.size() === 1) {
    return string.lower(keyCode.Name);
  }

  return undefined;
}

function startsWithIgnoreCase(value: string, query: string) {
  if (query.size() === 0) {
    return false;
  }

  const normalizedValue = string.lower(value);
  return string.sub(normalizedValue, 1, query.size()) === query;
}

function findCurrentIndex(items: Array<SelectItemRegistration>, selectedObject: GuiObject | undefined) {
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

function findTypeaheadMatch(items: Array<SelectItemRegistration>, query: string, startIndex: number) {
  const itemCount = items.size();
  if (itemCount === 0) {
    return -1;
  }

  for (let attempts = 0; attempts < itemCount; attempts++) {
    const candidateIndex = (startIndex + attempts) % itemCount;
    const candidate = items[candidateIndex];
    if (!candidate || candidate.getDisabled()) {
      continue;
    }

    if (startsWithIgnoreCase(candidate.getTextValue(), query)) {
      return candidateIndex;
    }
  }

  return -1;
}

function focusItem(item: SelectItemRegistration | undefined) {
  if (!item) {
    return;
  }

  const node = item.getNode();
  if (!node || !node.Selectable) {
    return;
  }

  GuiService.SelectedObject = node;
}

function SelectContentImpl(props: SelectContentImplProps) {
  const selectContext = useSelectContext();

  const popper = usePopper({
    anchorRef: selectContext.triggerRef,
    contentRef: selectContext.contentRef,
    placement: props.placement,
    offset: props.offset,
    padding: props.padding,
    enabled: props.enabled,
  });

  const setContentRef = React.useCallback(
    (instance: Instance | undefined) => {
      selectContext.contentRef.current = toGuiObject(instance);
    },
    [selectContext.contentRef],
  );

  const searchRef = React.useRef("");
  const searchTimestampRef = React.useRef(0);

  React.useEffect(() => {
    if (!props.enabled) {
      return;
    }

    const orderedItems = selectContext.getOrderedItems();
    const selectedItem = orderedItems.find((item) => item.value === selectContext.value && !item.getDisabled());
    focusItem(selectedItem);
  }, [props.enabled, selectContext, selectContext.value]);

  React.useEffect(() => {
    if (!props.enabled) {
      return;
    }

    searchRef.current = "";
    searchTimestampRef.current = 0;

    const connection = UserInputService.InputBegan.Connect((inputObject, gameProcessedEvent) => {
      if (gameProcessedEvent) {
        return;
      }

      if (inputObject.UserInputType !== Enum.UserInputType.Keyboard) {
        return;
      }

      const contentNode = selectContext.contentRef.current;
      const selectedObject = GuiService.SelectedObject;
      if (!contentNode || !selectedObject || !selectedObject.IsDescendantOf(contentNode)) {
        return;
      }

      const searchCharacter = toSearchCharacter(inputObject.KeyCode);
      if (searchCharacter === undefined) {
        return;
      }

      const now = os.clock();
      const shouldResetQuery = now - searchTimestampRef.current > 0.8;
      const nextQuery = shouldResetQuery ? searchCharacter : `${searchRef.current}${searchCharacter}`;
      searchRef.current = nextQuery;
      searchTimestampRef.current = now;

      const orderedItems = selectContext.getOrderedItems();
      const currentIndex = findCurrentIndex(orderedItems, selectedObject);
      const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
      const matchIndex = findTypeaheadMatch(orderedItems, string.lower(nextQuery), startIndex);
      if (matchIndex < 0) {
        return;
      }

      const matchedItem = orderedItems[matchIndex];
      focusItem(matchedItem);
    });

    return () => {
      connection.Disconnect();
    };
  }, [props.enabled, selectContext]);

  const contentNode = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[SelectContent] `asChild` requires a child element.");
      }

      return (
        <Slot AnchorPoint={popper.anchorPoint} Position={popper.position} Visible={props.visible} ref={setContentRef}>
          {child}
        </Slot>
      );
    })()
  ) : (
    <frame
      AnchorPoint={popper.anchorPoint}
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Position={popper.position}
      Size={UDim2.fromOffset(0, 0)}
      Visible={props.visible}
      ref={setContentRef}
    >
      {props.children}
    </frame>
  );

  return (
    <DismissableLayer
      enabled={props.enabled}
      modal={false}
      onDismiss={props.onDismiss}
      onEscapeKeyDown={props.onEscapeKeyDown}
      onInteractOutside={props.onInteractOutside}
      onPointerDownOutside={props.onPointerDownOutside}
    >
      <RovingFocusGroup active={props.enabled} autoFocus="first" loop={selectContext.loop} orientation="vertical">
        {contentNode}
      </RovingFocusGroup>
    </DismissableLayer>
  );
}

export function SelectContent(props: SelectContentProps) {
  const selectContext = useSelectContext();
  const open = selectContext.open;
  const forceMount = props.forceMount === true;

  const handleDismiss = React.useCallback(() => {
    selectContext.setOpen(false);
  }, [selectContext]);

  if (!open && !forceMount) {
    return undefined;
  }

  if (forceMount) {
    return (
      <SelectContentImpl
        asChild={props.asChild}
        enabled={open}
        offset={props.offset}
        onDismiss={handleDismiss}
        onEscapeKeyDown={props.onEscapeKeyDown}
        onInteractOutside={props.onInteractOutside}
        onPointerDownOutside={props.onPointerDownOutside}
        padding={props.padding}
        placement={props.placement}
        visible={open}
      >
        {props.children}
      </SelectContentImpl>
    );
  }

  return (
    <Presence
      exitFallbackMs={0}
      present={open}
      render={(state) => (
        <SelectContentImpl
          asChild={props.asChild}
          enabled={state.isPresent}
          offset={props.offset}
          onDismiss={handleDismiss}
          onEscapeKeyDown={props.onEscapeKeyDown}
          onInteractOutside={props.onInteractOutside}
          onPointerDownOutside={props.onPointerDownOutside}
          padding={props.padding}
          placement={props.placement}
          visible={state.isPresent}
        >
          {props.children}
        </SelectContentImpl>
      )}
    />
  );
}
