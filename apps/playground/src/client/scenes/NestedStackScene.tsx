import { React } from "@lattice-ui/core";
import { DismissableLayer } from "@lattice-ui/layer";

export function NestedStackScene() {
  const [outerOpen, setOuterOpen] = React.useState(false);
  const [innerOpen, setInnerOpen] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(720, 28)}
        Text="Open Outer -> Open Inner. Press ESC twice: Inner first, then Outer."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={Color3.fromRGB(43, 105, 196)}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(0, 52)}
        Size={UDim2.fromOffset(180, 40)}
        Text="Open Outer Layer"
        TextColor3={Color3.fromRGB(240, 244, 250)}
        TextSize={16}
        Event={{
          Activated: () => {
            setOuterOpen(true);
          },
        }}
      />

      {outerOpen ? (
        <DismissableLayer
          onDismiss={() => {
            setInnerOpen(false);
            setOuterOpen(false);
          }}
        >
          <frame
            BackgroundColor3={Color3.fromRGB(25, 38, 56)}
            BorderSizePixel={0}
            Position={UDim2.fromScale(0.5, 0.5)}
            AnchorPoint={new Vector2(0.5, 0.5)}
            Size={UDim2.fromOffset(500, 320)}
            ZIndex={10}
          >
            <uicorner CornerRadius={new UDim(0, 10)} />
            <uipadding PaddingLeft={new UDim(0, 18)} PaddingRight={new UDim(0, 18)} PaddingTop={new UDim(0, 16)} />
            <textlabel
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 0)}
              Size={UDim2.fromOffset(420, 30)}
              Text="Outer Layer"
              TextColor3={Color3.fromRGB(236, 241, 248)}
              TextSize={24}
              TextXAlignment={Enum.TextXAlignment.Left}
              ZIndex={11}
            />
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={Color3.fromRGB(35, 127, 80)}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 58)}
              Size={UDim2.fromOffset(180, 38)}
              Text="Open Inner Layer"
              TextColor3={Color3.fromRGB(232, 246, 235)}
              TextSize={16}
              ZIndex={11}
              Event={{
                Activated: () => {
                  setInnerOpen(true);
                },
              }}
            />
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={Color3.fromRGB(92, 56, 125)}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(194, 58)}
              Size={UDim2.fromOffset(150, 38)}
              Text="Close Outer"
              TextColor3={Color3.fromRGB(245, 239, 248)}
              TextSize={16}
              ZIndex={11}
              Event={{
                Activated: () => {
                  setInnerOpen(false);
                  setOuterOpen(false);
                },
              }}
            />
          </frame>

          {innerOpen ? (
            <DismissableLayer
              onDismiss={() => {
                setInnerOpen(false);
              }}
            >
              <frame
                BackgroundColor3={Color3.fromRGB(45, 31, 68)}
                BorderSizePixel={0}
                Position={UDim2.fromScale(0.5, 0.5)}
                AnchorPoint={new Vector2(0.5, 0.5)}
                Size={UDim2.fromOffset(320, 170)}
                ZIndex={20}
              >
                <uicorner CornerRadius={new UDim(0, 10)} />
                <uipadding PaddingLeft={new UDim(0, 16)} PaddingRight={new UDim(0, 16)} PaddingTop={new UDim(0, 14)} />
                <textlabel
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 0)}
                  Size={UDim2.fromOffset(260, 28)}
                  Text="Inner Layer"
                  TextColor3={Color3.fromRGB(240, 232, 251)}
                  TextSize={22}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  ZIndex={21}
                />
                <textlabel
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 32)}
                  Size={UDim2.fromOffset(260, 46)}
                  Text="ESC/outside should close this one first."
                  TextColor3={Color3.fromRGB(204, 189, 223)}
                  TextSize={15}
                  TextWrapped={true}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  TextYAlignment={Enum.TextYAlignment.Top}
                  ZIndex={21}
                />
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={Color3.fromRGB(116, 77, 170)}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(0, 102)}
                  Size={UDim2.fromOffset(130, 34)}
                  Text="Close Inner"
                  TextColor3={Color3.fromRGB(245, 239, 251)}
                  TextSize={15}
                  ZIndex={21}
                  Event={{
                    Activated: () => {
                      setInnerOpen(false);
                    },
                  }}
                />
              </frame>
            </DismissableLayer>
          ) : undefined}
        </DismissableLayer>
      ) : undefined}
    </frame>
  );
}
