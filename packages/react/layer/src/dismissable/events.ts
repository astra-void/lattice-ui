import type { LayerInteractEvent } from "./types";

type OutsidePointerOptions = {
  insideRoots?: Array<GuiObject | undefined>;
  // Whether a hit on the boundary node itself counts as inside. True when the
  // consumer passes a real content ref (clicking the content's own bare areas
  // is inside). False for the layer's internal fallback boundary, which is a
  // full-screen positioning canvas — it is hit at every position and must not
  // be mistaken for content, or nothing would ever read as outside.
  boundaryMatchesSelf?: boolean;
};

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

function isWithinInsideRoots(hitObject: GuiObject, insideRoots: Array<GuiObject | undefined>) {
  for (const insideRoot of insideRoots) {
    if (!insideRoot) {
      continue;
    }

    if (hitObject === insideRoot || hitObject.IsDescendantOf(insideRoot)) {
      return true;
    }
  }

  return false;
}

function isWithinContentBoundary(hitObject: GuiObject, contentWrapper: GuiObject, matchesSelf: boolean) {
  if (matchesSelf && hitObject === contentWrapper) {
    return true;
  }
  return hitObject.IsDescendantOf(contentWrapper);
}

export function isOutsidePointerEvent(
  inputObject: InputObject,
  container: BasePlayerGui,
  contentWrapper: GuiObject,
  options: OutsidePointerOptions,
) {
  // `InputObject.Position` and `GetGuiObjectsAtPosition` share one coordinate
  // frame (checked in Studio against an IgnoreGuiInset layer), so the
  // pointer is hit-tested exactly where it is. Extra samples shifted by the GUI
  // inset used to turn a 36–58px band above and below every layer into "inside".
  const pointerPosition = inputObject.Position;
  const insideRoots = options.insideRoots ?? [];
  const boundaryMatchesSelf = options.boundaryMatchesSelf ?? true;

  const hitGuiObjects = container.GetGuiObjectsAtPosition(pointerPosition.X, pointerPosition.Y);
  for (const hitObject of hitGuiObjects) {
    if (
      isWithinContentBoundary(hitObject, contentWrapper, boundaryMatchesSelf) ||
      isWithinInsideRoots(hitObject, insideRoots)
    ) {
      return false;
    }
  }

  return true;
}
