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
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, menuItemRecipe, panelRecipe } from "../theme/recipes";

export function MenuRovingScene() {
  const [open, setOpen] = React.useState(false);
  const [lastSelect, setLastSelect] = React.useState("none");
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(860, 28)}
        Text="Open menu and test roving (Up/Down/Home/End), ESC/outside dismiss, select behavior."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(500, 24)}
        Text={`Open: ${open ? "true" : "false"} | Last select: ${lastSelect}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Menu onOpenChange={setOpen} open={open}>
        <MenuTrigger asChild>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "md" }, theme), {
              Position: UDim2.fromOffset(0, 72),
              Size: UDim2.fromOffset(170, 42),
              Text: "Toggle Menu",
            }) as Record<string, unknown>)}
          />
        </MenuTrigger>

        <MenuPortal>
          <MenuContent asChild loop={true} offset={new Vector2(0, 8)} placement="bottom">
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Size: UDim2.fromOffset(250, 260),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
              <uipadding
                PaddingLeft={new UDim(0, theme.space[10])}
                PaddingRight={new UDim(0, theme.space[10])}
                PaddingTop={new UDim(0, theme.space[10])}
              />
              <uilistlayout
                FillDirection={Enum.FillDirection.Vertical}
                Padding={new UDim(0, theme.space[6])}
                SortOrder={Enum.SortOrder.LayoutOrder}
              />

              <MenuLabel asChild>
                <Text
                  BackgroundTransparency={1}
                  LayoutOrder={1}
                  Size={UDim2.fromOffset(220, 20)}
                  Text="Actions"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </MenuLabel>

              <MenuGroup asChild>
                <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(220, 110)}>
                  <uilistlayout
                    FillDirection={Enum.FillDirection.Vertical}
                    Padding={new UDim(0, theme.space[4])}
                    SortOrder={Enum.SortOrder.LayoutOrder}
                  />

                  <MenuItem
                    asChild
                    onSelect={() => {
                      setLastSelect("new-file");
                    }}
                  >
                    <textbutton
                      {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                        LayoutOrder: 1,
                        Size: UDim2.fromOffset(220, 32),
                        Text: "New File",
                      }) as Record<string, unknown>)}
                    >
                      <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                    </textbutton>
                  </MenuItem>

                  <MenuItem asChild disabled={true}>
                    <textbutton
                      {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "true" }, theme), {
                        LayoutOrder: 2,
                        Size: UDim2.fromOffset(220, 32),
                        Text: "Disabled Item",
                      }) as Record<string, unknown>)}
                    >
                      <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
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
                      {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                        LayoutOrder: 3,
                        Size: UDim2.fromOffset(220, 32),
                        Text: "Keep Open",
                      }) as Record<string, unknown>)}
                    >
                      <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                    </textbutton>
                  </MenuItem>
                </frame>
              </MenuGroup>

              <MenuSeparator asChild>
                <frame
                  BackgroundColor3={theme.colors.border}
                  BorderSizePixel={0}
                  LayoutOrder={3}
                  Size={UDim2.fromOffset(220, 1)}
                />
              </MenuSeparator>

              <MenuItem
                asChild
                onSelect={() => {
                  setLastSelect("delete");
                }}
              >
                <textbutton
                  {...(mergeGuiProps(menuItemRecipe({ intent: "danger", disabled: "false" }, theme), {
                    LayoutOrder: 4,
                    Size: UDim2.fromOffset(220, 32),
                    Text: "Delete",
                  }) as Record<string, unknown>)}
                >
                  <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                </textbutton>
              </MenuItem>
            </frame>
          </MenuContent>
        </MenuPortal>
      </Menu>
    </frame>
  );
}
