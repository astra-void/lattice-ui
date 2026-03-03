import { React } from "@lattice-ui/core";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@lattice-ui/popover";

export function PopoverBasicScene() {
  const [open, setOpen] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(760, 28)}
        Text="Trigger click opens popover. ESC and outside click dismiss it."
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

      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundColor3={Color3.fromRGB(43, 105, 196)}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(0, 72)}
            Size={UDim2.fromOffset(180, 42)}
            Text={open ? "Opened" : "Toggle Popover"}
            TextColor3={Color3.fromRGB(240, 244, 250)}
            TextSize={16}
          />
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent asChild offset={new Vector2(0, 10)} placement="bottom">
            <frame BackgroundColor3={Color3.fromRGB(34, 43, 58)} BorderSizePixel={0} Size={UDim2.fromOffset(300, 180)}>
              <uicorner CornerRadius={new UDim(0, 10)} />
              <uipadding PaddingLeft={new UDim(0, 14)} PaddingRight={new UDim(0, 14)} PaddingTop={new UDim(0, 12)} />
              <textlabel
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(260, 28)}
                Text="Popover Basic"
                TextColor3={Color3.fromRGB(236, 241, 248)}
                TextSize={22}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <textlabel
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 34)}
                Size={UDim2.fromOffset(270, 56)}
                Text="Outside click / ESC closes this panel."
                TextColor3={Color3.fromRGB(186, 196, 208)}
                TextSize={16}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
              />
              <PopoverClose asChild>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={Color3.fromRGB(97, 62, 145)}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(0, 112)}
                  Size={UDim2.fromOffset(130, 36)}
                  Text="Close"
                  TextColor3={Color3.fromRGB(243, 238, 250)}
                  TextSize={15}
                />
              </PopoverClose>
            </frame>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </frame>
  );
}
