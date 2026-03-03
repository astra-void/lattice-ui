import { React } from "@lattice-ui/core";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuPortal,
  MenuSeparator,
  MenuTrigger,
} from "@lattice-ui/menu";

export function MenuRovingScene() {
  const [open, setOpen] = React.useState(false);
  const [lastSelect, setLastSelect] = React.useState("none");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(860, 28)}
        Text="Open menu and test roving (Up/Down/Home/End), ESC/outside dismiss, select behavior."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(500, 24)}
        Text={`Open: ${open ? "true" : "false"} | Last select: ${lastSelect}`}
        TextColor3={Color3.fromRGB(177, 186, 199)}
        TextSize={16}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Menu onOpenChange={setOpen} open={open}>
        <MenuTrigger asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundColor3={Color3.fromRGB(43, 105, 196)}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(0, 72)}
            Size={UDim2.fromOffset(170, 42)}
            Text="Toggle Menu"
            TextColor3={Color3.fromRGB(240, 244, 250)}
            TextSize={16}
          />
        </MenuTrigger>

        <MenuPortal>
          <MenuContent asChild loop={true} offset={new Vector2(0, 8)} placement="bottom">
            <frame BackgroundColor3={Color3.fromRGB(31, 40, 56)} BorderSizePixel={0} Size={UDim2.fromOffset(250, 260)}>
              <uicorner CornerRadius={new UDim(0, 10)} />
              <uipadding PaddingLeft={new UDim(0, 10)} PaddingRight={new UDim(0, 10)} PaddingTop={new UDim(0, 10)} />
              <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 6)} SortOrder={Enum.SortOrder.LayoutOrder} />

              <MenuLabel asChild>
                <textlabel
                  BackgroundTransparency={1}
                  LayoutOrder={1}
                  Size={UDim2.fromOffset(220, 20)}
                  Text="Actions"
                  TextColor3={Color3.fromRGB(165, 175, 194)}
                  TextSize={14}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </MenuLabel>

              <MenuGroup asChild>
                <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(220, 110)}>
                  <uilistlayout
                    FillDirection={Enum.FillDirection.Vertical}
                    Padding={new UDim(0, 4)}
                    SortOrder={Enum.SortOrder.LayoutOrder}
                  />

                  <MenuItem
                    asChild
                    onSelect={() => {
                      setLastSelect("new-file");
                    }}
                  >
                    <textbutton
                      AutoButtonColor={false}
                      BackgroundColor3={Color3.fromRGB(49, 56, 72)}
                      BorderSizePixel={0}
                      LayoutOrder={1}
                      Size={UDim2.fromOffset(220, 32)}
                      Text="New File"
                      TextColor3={Color3.fromRGB(236, 241, 249)}
                      TextSize={15}
                      TextXAlignment={Enum.TextXAlignment.Left}
                    >
                      <uipadding PaddingLeft={new UDim(0, 10)} />
                    </textbutton>
                  </MenuItem>

                  <MenuItem asChild disabled={true}>
                    <textbutton
                      AutoButtonColor={false}
                      BackgroundColor3={Color3.fromRGB(40, 45, 58)}
                      BorderSizePixel={0}
                      LayoutOrder={2}
                      Size={UDim2.fromOffset(220, 32)}
                      Text="Disabled Item"
                      TextColor3={Color3.fromRGB(129, 136, 151)}
                      TextSize={15}
                      TextXAlignment={Enum.TextXAlignment.Left}
                    >
                      <uipadding PaddingLeft={new UDim(0, 10)} />
                    </textbutton>
                  </MenuItem>

                  <MenuItem
                    asChild
                    onSelect={(event) => {
                      event.preventDefault();
                      setLastSelect("keep-open");
                    }}
                  >
                    <textbutton
                      AutoButtonColor={false}
                      BackgroundColor3={Color3.fromRGB(49, 56, 72)}
                      BorderSizePixel={0}
                      LayoutOrder={3}
                      Size={UDim2.fromOffset(220, 32)}
                      Text="Keep Open"
                      TextColor3={Color3.fromRGB(236, 241, 249)}
                      TextSize={15}
                      TextXAlignment={Enum.TextXAlignment.Left}
                    >
                      <uipadding PaddingLeft={new UDim(0, 10)} />
                    </textbutton>
                  </MenuItem>
                </frame>
              </MenuGroup>

              <MenuSeparator asChild>
                <frame BackgroundColor3={Color3.fromRGB(72, 79, 97)} BorderSizePixel={0} LayoutOrder={3} Size={UDim2.fromOffset(220, 1)} />
              </MenuSeparator>

              <MenuItem
                asChild
                onSelect={() => {
                  setLastSelect("delete");
                }}
              >
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={Color3.fromRGB(87, 51, 56)}
                  BorderSizePixel={0}
                  LayoutOrder={4}
                  Size={UDim2.fromOffset(220, 32)}
                  Text="Delete"
                  TextColor3={Color3.fromRGB(244, 223, 226)}
                  TextSize={15}
                  TextXAlignment={Enum.TextXAlignment.Left}
                >
                  <uipadding PaddingLeft={new UDim(0, 10)} />
                </textbutton>
              </MenuItem>
            </frame>
          </MenuContent>
        </MenuPortal>
      </Menu>
    </frame>
  );
}
