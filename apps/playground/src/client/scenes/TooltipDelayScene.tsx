import { React } from "@lattice-ui/core";
import { Tooltip } from "@lattice-ui/tooltip";

export function TooltipDelayScene() {
  const [open, setOpen] = React.useState(false);

  return (
    <Tooltip.Provider delayDuration={700} skipDelayDuration={300}>
      <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
        <textlabel
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 0)}
          Size={UDim2.fromOffset(860, 28)}
          Text="Hover/focus trigger: first open 700ms, re-entry within window 300ms."
          TextColor3={Color3.fromRGB(223, 229, 237)}
          TextSize={20}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <textlabel
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 34)}
          Size={UDim2.fromOffset(320, 24)}
          Text={`Open: ${open ? "true" : "false"}`}
          TextColor3={Color3.fromRGB(177, 186, 199)}
          TextSize={16}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Tooltip.Root onOpenChange={setOpen}>
          <Tooltip.Trigger asChild>
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={Color3.fromRGB(43, 105, 196)}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 74)}
              Size={UDim2.fromOffset(220, 42)}
              Text="Hover / Focus me"
              TextColor3={Color3.fromRGB(240, 244, 250)}
              TextSize={16}
            />
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content asChild sideOffset={8} placement="bottom">
              <frame BackgroundColor3={Color3.fromRGB(28, 33, 48)} BorderSizePixel={0} Size={UDim2.fromOffset(250, 80)}>
                <uicorner CornerRadius={new UDim(0, 8)} />
                <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} PaddingTop={new UDim(0, 8)} />
                <textlabel
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(220, 60)}
                  Text="Tooltip opened by delay policy."
                  TextColor3={Color3.fromRGB(224, 232, 244)}
                  TextSize={15}
                  TextWrapped={true}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  TextYAlignment={Enum.TextYAlignment.Top}
                />
              </frame>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </frame>
    </Tooltip.Provider>
  );
}
