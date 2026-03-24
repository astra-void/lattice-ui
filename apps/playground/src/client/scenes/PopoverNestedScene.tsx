import { React } from "@lattice-ui/core";
import { Popover } from "@lattice-ui/popover";
import { playgroundSurfaceTransition } from "../motion";

export function PopoverNestedScene() {
  const [outerOpen, setOuterOpen] = React.useState(false);
  const [innerOpen, setInnerOpen] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(780, 28)}
        Text="Nested popover stacking: outside click closes the inner layer before the outer one."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Popover.Root
        onOpenChange={(nextOpen) => {
          setOuterOpen(nextOpen);
          if (!nextOpen) {
            setInnerOpen(false);
          }
        }}
        open={outerOpen}
      >
        <Popover.Trigger asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundColor3={Color3.fromRGB(43, 105, 196)}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(0, 50)}
            Size={UDim2.fromOffset(180, 40)}
            Text="Toggle Outer"
            TextColor3={Color3.fromRGB(240, 244, 250)}
            TextSize={16}
          />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            asChild
            offset={new Vector2(0, 10)}
            placement="bottom"
            transition={playgroundSurfaceTransition}
          >
            <frame BackgroundColor3={Color3.fromRGB(31, 42, 58)} BorderSizePixel={0} Size={UDim2.fromOffset(360, 220)}>
              <uicorner CornerRadius={new UDim(0, 9)} />
              <uipadding PaddingLeft={new UDim(0, 12)} PaddingRight={new UDim(0, 12)} PaddingTop={new UDim(0, 10)} />
              <textlabel
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(320, 24)}
                Text="Outer Popover"
                TextColor3={Color3.fromRGB(237, 242, 249)}
                TextSize={21}
                TextXAlignment={Enum.TextXAlignment.Left}
              />

              <Popover.Root onOpenChange={setInnerOpen} open={innerOpen}>
                <Popover.Trigger asChild>
                  <textbutton
                    AutoButtonColor={false}
                    BackgroundColor3={Color3.fromRGB(36, 128, 82)}
                    BorderSizePixel={0}
                    Position={UDim2.fromOffset(0, 42)}
                    Size={UDim2.fromOffset(160, 34)}
                    Text="Toggle Inner"
                    TextColor3={Color3.fromRGB(231, 246, 236)}
                    TextSize={15}
                  />
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Content
                    asChild
                    offset={new Vector2(0, 8)}
                    placement="right"
                    transition={playgroundSurfaceTransition}
                  >
                    <frame
                      BackgroundColor3={Color3.fromRGB(56, 36, 80)}
                      BorderSizePixel={0}
                      Size={UDim2.fromOffset(220, 110)}
                    >
                      <uicorner CornerRadius={new UDim(0, 8)} />
                      <uipadding
                        PaddingLeft={new UDim(0, 10)}
                        PaddingRight={new UDim(0, 10)}
                        PaddingTop={new UDim(0, 8)}
                      />
                      <textlabel
                        BackgroundTransparency={1}
                        Size={UDim2.fromOffset(180, 22)}
                        Text="Inner Popover"
                        TextColor3={Color3.fromRGB(242, 233, 252)}
                        TextSize={18}
                        TextXAlignment={Enum.TextXAlignment.Left}
                      />
                      <textlabel
                        BackgroundTransparency={1}
                        Position={UDim2.fromOffset(0, 26)}
                        Size={UDim2.fromOffset(190, 46)}
                        Text="Outside click closes this first."
                        TextColor3={Color3.fromRGB(208, 193, 225)}
                        TextSize={14}
                        TextWrapped={true}
                        TextXAlignment={Enum.TextXAlignment.Left}
                        TextYAlignment={Enum.TextYAlignment.Top}
                      />
                    </frame>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </frame>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </frame>
  );
}
