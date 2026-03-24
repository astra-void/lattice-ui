import { React } from "@lattice-ui/core";
import { Dialog } from "@lattice-ui/dialog";
import { playgroundOverlayTransition, playgroundSurfaceTransition } from "../motion";

export function DialogModalBlockScene() {
  const [backgroundPresses, setBackgroundPresses] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(760, 28)}
        Text="Default modal dialog should block clicks on background controls while open."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={Color3.fromRGB(47, 111, 206)}
        BorderSizePixel={0}
        Event={{
          Activated: () => {
            setBackgroundPresses((value) => value + 1);
          },
        }}
        Position={UDim2.fromOffset(0, 52)}
        Size={UDim2.fromOffset(250, 44)}
        Text={`Background Count: ${backgroundPresses}`}
        TextColor3={Color3.fromRGB(238, 245, 252)}
        TextSize={16}
      />

      <Dialog.Root onOpenChange={setOpen} open={open}>
        <Dialog.Trigger asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundColor3={Color3.fromRGB(35, 127, 80)}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(268, 52)}
            Size={UDim2.fromOffset(190, 44)}
            Text="Open Modal Dialog"
            TextColor3={Color3.fromRGB(231, 245, 235)}
            TextSize={16}
          />
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Content transition={playgroundSurfaceTransition}>
            <Dialog.Overlay transition={playgroundOverlayTransition} />
            <frame
              AnchorPoint={new Vector2(0.5, 0.5)}
              BackgroundColor3={Color3.fromRGB(30, 39, 54)}
              BorderSizePixel={0}
              Position={UDim2.fromScale(0.5, 0.5)}
              Size={UDim2.fromOffset(430, 230)}
              ZIndex={10}
            >
              <uicorner CornerRadius={new UDim(0, 8)} />
              <uipadding PaddingLeft={new UDim(0, 16)} PaddingRight={new UDim(0, 16)} PaddingTop={new UDim(0, 14)} />
              <textlabel
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 0)}
                Size={UDim2.fromOffset(360, 30)}
                Text="Modal Dialog"
                TextColor3={Color3.fromRGB(236, 241, 248)}
                TextSize={24}
                TextXAlignment={Enum.TextXAlignment.Left}
                ZIndex={11}
              />
              <textlabel
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 36)}
                Size={UDim2.fromOffset(360, 62)}
                Text="Click the background counter while this is open. Count should not increase."
                TextColor3={Color3.fromRGB(184, 195, 209)}
                TextSize={16}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
                ZIndex={11}
              />
              <Dialog.Close asChild>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={Color3.fromRGB(109, 71, 160)}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(0, 146)}
                  Size={UDim2.fromOffset(150, 38)}
                  Text="Close Dialog"
                  TextColor3={Color3.fromRGB(243, 237, 250)}
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
