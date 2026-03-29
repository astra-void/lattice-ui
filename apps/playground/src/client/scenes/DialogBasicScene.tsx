import { React } from "@lattice-ui/core";
import { Dialog } from "@lattice-ui/dialog";
import { playgroundOverlayTransition, playgroundSurfaceTransition } from "../motion";

export function DialogBasicScene() {
  const [open, setOpen] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(760, 28)}
        Text="Trigger opens a dialog. Outside click, overlay click, and Close button dismiss."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(300, 24)}
        Text={`Open: ${open ? "true" : "false"}`}
        TextColor3={Color3.fromRGB(177, 186, 199)}
        TextSize={16}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Dialog.Root onOpenChange={setOpen} open={open}>
        <Dialog.Trigger asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundColor3={Color3.fromRGB(43, 105, 196)}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(0, 72)}
            Size={UDim2.fromOffset(170, 42)}
            Text={open ? "Dialog Opened" : "Open Dialog"}
            TextColor3={Color3.fromRGB(240, 244, 250)}
            TextSize={16}
          />
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Content transition={playgroundSurfaceTransition}>
            <Dialog.Overlay transition={playgroundOverlayTransition} />
            <frame
              AnchorPoint={new Vector2(0.5, 0.5)}
              BackgroundColor3={Color3.fromRGB(33, 41, 56)}
              BorderSizePixel={0}
              Position={UDim2.fromScale(0.5, 0.5)}
              Size={UDim2.fromOffset(420, 230)}
              ZIndex={10}
            >
              <uicorner CornerRadius={new UDim(0, 8)} />
              <uipadding PaddingLeft={new UDim(0, 18)} PaddingRight={new UDim(0, 18)} PaddingTop={new UDim(0, 16)} />
              <textlabel
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 0)}
                Size={UDim2.fromOffset(360, 30)}
                Text="Dialog Basic"
                TextColor3={Color3.fromRGB(236, 241, 248)}
                TextSize={24}
                TextXAlignment={Enum.TextXAlignment.Left}
                ZIndex={11}
              />
              <textlabel
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 38)}
                Size={UDim2.fromOffset(360, 72)}
                Text="Click outside the content or use the Close button. Overlay click also closes the dialog."
                TextColor3={Color3.fromRGB(184, 195, 209)}
                TextSize={17}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
                ZIndex={11}
              />
              <Dialog.Close asChild>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={Color3.fromRGB(98, 58, 142)}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(0, 148)}
                  Size={UDim2.fromOffset(160, 40)}
                  Text="Close Dialog"
                  TextColor3={Color3.fromRGB(244, 242, 249)}
                  TextSize={16}
                  ZIndex={11}
                />
              </Dialog.Close>
            </frame>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </frame>
  );
}
