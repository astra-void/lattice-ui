import { composeEvents, getPassthroughProps, React, Slot } from "@lattice-ui/react-runtime";
import { useContextMenuContext } from "./context";
import type { ContextMenuTriggerProps } from "./types";

const GuiService = game.GetService("GuiService");

const OWN_PROPS = ["asChild", "disabled", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `textbutton` renders an opaque grey box
// labelled "Button". Neutralize only that, and leave every real appearance decision (colors, size,
// fonts, text) to the consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  AutoButtonColor: false,
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
  Text: "",
};

/**
 * Converts a raw pointer position (top-bar inclusive, as reported by
 * `InputObject.Position`) into the inset-adjusted space used by
 * `GuiObject.AbsolutePosition`, which is what the popper positions against.
 */
function toAnchorPosition(rawPosition: Vector3) {
  const [insetTopLeft] = GuiService.GetGuiInset();
  return new Vector2(rawPosition.X - insetTopLeft.X, rawPosition.Y - insetTopLeft.Y);
}

export function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  const contextMenuContext = useContextMenuContext();

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (props.disabled) {
        return;
      }

      if (inputObject.UserInputType === Enum.UserInputType.MouseButton2) {
        contextMenuContext.openAtPosition(toAnchorPosition(inputObject.Position));
      }
    },
    [contextMenuContext, props.disabled],
  );

  const passthrough = getPassthroughProps(props, OWN_PROPS);
  const behaviorProps = {
    Active: props.disabled !== true,
    Event: composeEvents(passthrough.Event, { InputBegan: handleInputBegan }),
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ContextMenuTrigger] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...passthrough} {...behaviorProps}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps}>
      {props.children}
    </textbutton>
  );
}
