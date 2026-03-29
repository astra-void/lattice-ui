import { React } from "@lattice-ui/core";
import { Popover } from "@lattice-ui/popover";
import { playgroundSurfaceTransition } from "../motion";

type CornerKey = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const cornerOrder: Array<CornerKey> = ["top-left", "top-right", "bottom-right", "bottom-left"];

const cornerPositions: Record<CornerKey, UDim2> = {
  "top-left": UDim2.fromOffset(20, 24),
  "top-right": UDim2.fromOffset(780, 24),
  "bottom-left": UDim2.fromOffset(20, 360),
  "bottom-right": UDim2.fromOffset(780, 360),
};

export function PopoverFlipClampScene() {
  const [open, setOpen] = React.useState(false);
  const [corner, setCorner] = React.useState<CornerKey>("top-left");

  const cycleCorner = React.useCallback(() => {
    const currentIndex = cornerOrder.indexOf(corner);
    const nextIndex = (currentIndex + 1) % cornerOrder.size();
    setCorner(cornerOrder[nextIndex]);
  }, [corner]);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(850, 28)}
        Text="Cycle anchor around corners and check popper flip/clamp near edges."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Popover.Root onOpenChange={setOpen} open={open}>
        <Popover.Trigger asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundColor3={Color3.fromRGB(47, 112, 206)}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(0, 48)}
            Size={UDim2.fromOffset(150, 38)}
            Text={open ? "Close" : "Open"}
            TextColor3={Color3.fromRGB(237, 245, 252)}
            TextSize={15}
          />
        </Popover.Trigger>

        <textbutton
          AutoButtonColor={false}
          BackgroundColor3={Color3.fromRGB(86, 95, 118)}
          BorderSizePixel={0}
          Event={{
            Activated: cycleCorner,
          }}
          Position={UDim2.fromOffset(162, 48)}
          Size={UDim2.fromOffset(190, 38)}
          Text={`Anchor: ${corner}`}
          TextColor3={Color3.fromRGB(236, 241, 248)}
          TextSize={15}
        />

        <Popover.Anchor asChild>
          <frame
            BackgroundColor3={Color3.fromRGB(150, 87, 50)}
            BorderSizePixel={0}
            Position={cornerPositions[corner]}
            Size={UDim2.fromOffset(120, 30)}
          >
            <uicorner CornerRadius={new UDim(0, 6)} />
            <textlabel
              BackgroundTransparency={1}
              Size={UDim2.fromScale(1, 1)}
              Text="Anchor"
              TextColor3={Color3.fromRGB(246, 233, 223)}
              TextSize={14}
            />
          </frame>
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content
            asChild
            offset={new Vector2(0, 8)}
            padding={10}
            placement="bottom"
            transition={playgroundSurfaceTransition}
          >
            <frame BackgroundColor3={Color3.fromRGB(32, 41, 56)} BorderSizePixel={0} Size={UDim2.fromOffset(230, 120)}>
              <uicorner CornerRadius={new UDim(0, 8)} />
              <uipadding PaddingLeft={new UDim(0, 12)} PaddingRight={new UDim(0, 12)} PaddingTop={new UDim(0, 10)} />
              <textlabel
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(190, 26)}
                Text="Flip / Clamp"
                TextColor3={Color3.fromRGB(238, 242, 248)}
                TextSize={20}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <textlabel
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 30)}
                Size={UDim2.fromOffset(190, 56)}
                Text={`Current anchor: ${corner}`}
                TextColor3={Color3.fromRGB(182, 193, 208)}
                TextSize={15}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
              />
            </frame>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </frame>
  );
}
