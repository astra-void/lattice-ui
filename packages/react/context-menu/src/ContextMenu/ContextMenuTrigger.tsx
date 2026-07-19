import { React, Slot } from "@lattice-ui/react-runtime";
import { useContextMenuContext } from "./context";
import type { ContextMenuTriggerProps } from "./types";

const GuiService = game.GetService("GuiService");

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

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ContextMenuTrigger] `asChild` requires a child element.");
    }

    return (
      <Slot Active={props.disabled !== true} Event={{ InputBegan: handleInputBegan }}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={props.disabled !== true}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(47, 53, 68)}
      BorderSizePixel={0}
      Event={{ InputBegan: handleInputBegan }}
      Size={UDim2.fromOffset(280, 160)}
      Text="Right-click here"
      TextColor3={Color3.fromRGB(234, 239, 247)}
      TextSize={15}
    >
      {props.children}
    </textbutton>
  );
}
