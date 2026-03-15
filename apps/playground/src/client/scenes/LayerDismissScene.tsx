import { React } from "@lattice-ui/core";
import { DismissableLayer } from "@lattice-ui/layer";

export function LayerDismissScene() {
  const [open, setOpen] = React.useState(false);
  const [eventCount, setEventCount] = React.useState(0);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(580, 28)}
        Text="Outside click closes the layer."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(360, 24)}
        Text={`Dismiss calls: ${eventCount}`}
        TextColor3={Color3.fromRGB(177, 186, 199)}
        TextSize={16}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={Color3.fromRGB(43, 105, 196)}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(0, 72)}
        Size={UDim2.fromOffset(200, 42)}
        Text={open ? "Layer Opened" : "Open Dismissable Layer"}
        TextColor3={Color3.fromRGB(240, 244, 250)}
        TextSize={16}
        Event={{
          Activated: () => {
            setOpen(true);
          },
        }}
      />

      {open ? (
        <DismissableLayer
          onDismiss={() => {
            setOpen(false);
            setEventCount((value) => value + 1);
          }}
        >
          <frame
            BackgroundColor3={Color3.fromRGB(33, 41, 56)}
            BorderSizePixel={0}
            Position={UDim2.fromScale(0.5, 0.5)}
            AnchorPoint={new Vector2(0.5, 0.5)}
            Size={UDim2.fromOffset(420, 220)}
            ZIndex={10}
          >
            <uicorner CornerRadius={new UDim(0, 8)} />
            <uipadding PaddingLeft={new UDim(0, 18)} PaddingRight={new UDim(0, 18)} PaddingTop={new UDim(0, 16)} />
            <textlabel
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 0)}
              Size={UDim2.fromOffset(360, 30)}
              Text="DismissableLayer"
              TextColor3={Color3.fromRGB(236, 241, 248)}
              TextSize={24}
              TextXAlignment={Enum.TextXAlignment.Left}
              ZIndex={11}
            />
            <textlabel
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 38)}
              Size={UDim2.fromOffset(360, 60)}
              Text="Click outside this panel to dismiss it."
              TextColor3={Color3.fromRGB(184, 195, 209)}
              TextSize={17}
              TextWrapped={true}
              TextXAlignment={Enum.TextXAlignment.Left}
              TextYAlignment={Enum.TextYAlignment.Top}
              ZIndex={11}
            />
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={Color3.fromRGB(98, 58, 142)}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 142)}
              Size={UDim2.fromOffset(170, 40)}
              Text="Close"
              TextColor3={Color3.fromRGB(244, 242, 249)}
              TextSize={16}
              ZIndex={11}
              Event={{
                Activated: () => {
                  setOpen(false);
                },
              }}
            />
          </frame>
        </DismissableLayer>
      ) : undefined}
    </frame>
  );
}
