import type { LayerInteractEvent } from "./types";

export function isPointerInput(inputObject: InputObject) {
  return (
    inputObject.UserInputType === Enum.UserInputType.MouseButton1 ||
    inputObject.UserInputType === Enum.UserInputType.Touch
  );
}

export function toLayerInteractEvent(originalEvent: InputObject): LayerInteractEvent {
  const event: LayerInteractEvent = {
    originalEvent,
    defaultPrevented: false,
    preventDefault: () => {
      event.defaultPrevented = true;
    },
  };
  return event;
}

export function isOutsidePointerEvent(inputObject: InputObject, container: BasePlayerGui, contentRoot: GuiObject) {
  const pointerPosition = inputObject.Position;
  const hitGuiObjects = container.GetGuiObjectsAtPosition(pointerPosition.X, pointerPosition.Y);
  for (const hitObject of hitGuiObjects) {
    if (hitObject.IsDescendantOf(contentRoot)) {
      return false;
    }
  }
  return true;
}
