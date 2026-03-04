import { React, Slot } from "@lattice-ui/core";
import type { ToastRootProps } from "./types";

export function ToastRoot(props: ToastRootProps) {
  const visible = props.visible ?? true;

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[ToastRoot] `asChild` requires a child element.");
    }

    return <Slot Visible={visible}>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(38, 45, 59)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(320, 72)}
      Visible={visible}
    >
      <uicorner CornerRadius={new UDim(0, 10)} />
      <uipadding
        PaddingBottom={new UDim(0, 8)}
        PaddingLeft={new UDim(0, 10)}
        PaddingRight={new UDim(0, 10)}
        PaddingTop={new UDim(0, 8)}
      />
      {props.children}
    </frame>
  );
}
