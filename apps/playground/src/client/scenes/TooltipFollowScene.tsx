import { React } from "@lattice-ui/core";
import { Tooltip } from "@lattice-ui/tooltip";

export function TooltipFollowScene() {
  const [anchorX, setAnchorX] = React.useState(120);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(820, 28)}
        Text="Move the anchor button while tooltip is open to verify follow updates."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={Color3.fromRGB(88, 97, 120)}
        BorderSizePixel={0}
        Event={{
          Activated: () => {
            const nextX = anchorX >= 600 ? 120 : anchorX + 120;
            setAnchorX(nextX);
          },
        }}
        Position={UDim2.fromOffset(0, 50)}
        Size={UDim2.fromOffset(200, 38)}
        Text="Move Anchor"
        TextColor3={Color3.fromRGB(236, 241, 248)}
        TextSize={15}
      />

      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundColor3={Color3.fromRGB(43, 105, 196)}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(anchorX, 200)}
            Size={UDim2.fromOffset(170, 42)}
            Text="Hover / Focus me"
            TextColor3={Color3.fromRGB(240, 244, 250)}
            TextSize={16}
          />
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content asChild offset={new Vector2(0, 8)} placement="top">
            <frame BackgroundColor3={Color3.fromRGB(31, 36, 50)} BorderSizePixel={0} Size={UDim2.fromOffset(220, 70)}>
              <uicorner CornerRadius={new UDim(0, 8)} />
              <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} PaddingTop={new UDim(0, 8)} />
              <textlabel
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(190, 50)}
                Text="Anchor movement should reposition this tooltip."
                TextColor3={Color3.fromRGB(224, 232, 244)}
                TextSize={14}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
              />
            </frame>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </frame>
  );
}
