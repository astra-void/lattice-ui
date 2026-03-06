import { React, useControllableState } from "@lattice-ui/core";
import { DialogContextProvider } from "./context";
import { DialogClose } from "./DialogClose";
import { DialogContent } from "./DialogContent";
import { DialogOverlay } from "./DialogOverlay";
import { DialogPortal } from "./DialogPortal";
import { DialogTrigger } from "./DialogTrigger";
import type { DialogProps } from "./types";

export function Dialog(props: DialogProps) {
  const [open, setOpenState] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const modal = props.modal ?? true;
  const triggerRef = React.useRef<GuiObject>();

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      setOpenState(nextOpen);
    },
    [setOpenState],
  );

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      modal,
      triggerRef,
    }),
    [modal, open, setOpen],
  );

  return <DialogContextProvider value={contextValue}>{props.children}</DialogContextProvider>;
}

function DialogRootPreview() {
  return (
    <Dialog defaultOpen={true}>
      <DialogTrigger asChild>
        <textbutton
          AutoButtonColor={false}
          BackgroundColor3={Color3.fromRGB(82, 121, 255)}
          BorderSizePixel={0}
          Size={UDim2.fromOffset(156, 42)}
          Text="Open dialog"
          TextColor3={Color3.fromRGB(244, 247, 255)}
          TextSize={16}
        >
          <uicorner CornerRadius={new UDim(0, 16)} />
        </textbutton>
      </DialogTrigger>

      <DialogPortal>
        <DialogContent>
          <DialogOverlay asChild>
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={Color3.fromRGB(17, 19, 26)}
              BackgroundTransparency={0.24}
              BorderSizePixel={0}
              Size={UDim2.fromScale(1, 1)}
              Text=""
            />
          </DialogOverlay>

          <frame BackgroundColor3={Color3.fromRGB(24, 29, 40)} BorderSizePixel={0} Size={UDim2.fromOffset(320, 190)}>
            <uicorner CornerRadius={new UDim(0, 22)} />
            <uipadding
              PaddingBottom={new UDim(0, 20)}
              PaddingLeft={new UDim(0, 20)}
              PaddingRight={new UDim(0, 20)}
              PaddingTop={new UDim(0, 20)}
            />
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} SortOrder={Enum.SortOrder.LayoutOrder} />
            <textlabel
              AutomaticSize={Enum.AutomaticSize.Y}
              BackgroundTransparency={1}
              Size={UDim2.fromScale(1, 0)}
              Text="Dialog Preview"
              TextColor3={Color3.fromRGB(244, 247, 255)}
              TextSize={22}
              TextWrapped={true}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            <textlabel
              AutomaticSize={Enum.AutomaticSize.Y}
              BackgroundTransparency={1}
              Size={UDim2.fromScale(1, 0)}
              Text="In-file preview harness for source-first web preview."
              TextColor3={Color3.fromRGB(192, 200, 216)}
              TextSize={15}
              TextWrapped={true}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            <DialogClose asChild>
              <textbutton
                AutoButtonColor={false}
                BackgroundColor3={Color3.fromRGB(82, 121, 255)}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(120, 38)}
                Text="Close"
                TextColor3={Color3.fromRGB(244, 247, 255)}
                TextSize={15}
              >
                <uicorner CornerRadius={new UDim(0, 14)} />
              </textbutton>
            </DialogClose>
          </frame>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export const preview = {
  title: "Dialog Root",
  render: DialogRootPreview,
};
