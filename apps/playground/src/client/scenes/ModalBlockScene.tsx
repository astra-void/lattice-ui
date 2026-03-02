import { React } from "@lattice-ui/core";
import { DismissableLayer } from "@lattice-ui/layer";

export function ModalBlockScene() {
  const [backgroundPresses, setBackgroundPresses] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(760, 28)}
        Text="When modal is open, background button clicks should be blocked."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={Color3.fromRGB(47, 111, 206)}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(0, 52)}
        Size={UDim2.fromOffset(230, 44)}
        Text={`Background Count: ${backgroundPresses}`}
        TextColor3={Color3.fromRGB(238, 245, 252)}
        TextSize={16}
        Event={{
          Activated: () => {
            setBackgroundPresses((value) => value + 1);
          },
        }}
      />
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={Color3.fromRGB(35, 127, 80)}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(248, 52)}
        Size={UDim2.fromOffset(170, 44)}
        Text="Open Modal"
        TextColor3={Color3.fromRGB(231, 245, 235)}
        TextSize={16}
        Event={{
          Activated: () => {
            setModalOpen(true);
          },
        }}
      />

      {modalOpen ? (
        <DismissableLayer
          modal={true}
          onDismiss={() => {
            setModalOpen(false);
          }}
        >
          <frame
            BackgroundColor3={Color3.fromRGB(30, 39, 54)}
            BorderSizePixel={0}
            Position={UDim2.fromScale(0.5, 0.5)}
            AnchorPoint={new Vector2(0.5, 0.5)}
            Size={UDim2.fromOffset(420, 220)}
            ZIndex={10}
          >
            <uicorner CornerRadius={new UDim(0, 8)} />
            <uipadding PaddingLeft={new UDim(0, 16)} PaddingRight={new UDim(0, 16)} PaddingTop={new UDim(0, 14)} />
            <textlabel
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 0)}
              Size={UDim2.fromOffset(340, 30)}
              Text="Modal Layer"
              TextColor3={Color3.fromRGB(236, 241, 248)}
              TextSize={24}
              TextXAlignment={Enum.TextXAlignment.Left}
              ZIndex={11}
            />
            <textlabel
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 36)}
              Size={UDim2.fromOffset(350, 62)}
              Text="Try clicking the background counter button while this modal is open."
              TextColor3={Color3.fromRGB(184, 195, 209)}
              TextSize={16}
              TextWrapped={true}
              TextXAlignment={Enum.TextXAlignment.Left}
              TextYAlignment={Enum.TextYAlignment.Top}
              ZIndex={11}
            />
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={Color3.fromRGB(109, 71, 160)}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 146)}
              Size={UDim2.fromOffset(130, 38)}
              Text="Close"
              TextColor3={Color3.fromRGB(243, 237, 250)}
              TextSize={16}
              ZIndex={11}
              Event={{
                Activated: () => {
                  setModalOpen(false);
                },
              }}
            />
          </frame>
        </DismissableLayer>
      ) : undefined}
    </frame>
  );
}
