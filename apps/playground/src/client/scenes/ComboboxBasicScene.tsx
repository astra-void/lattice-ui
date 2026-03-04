import { React } from "@lattice-ui/core";
import { Combobox } from "@lattice-ui/combobox";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, menuItemRecipe, panelRecipe } from "../theme/recipes";

export function ComboboxBasicScene() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState("alpha");
  const [open, setOpen] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Combobox: type-to-filter + enforced selection"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Controlled open: ${open ? "true" : "false"} | value: ${value}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 220),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

        <Combobox.Root onOpenChange={setOpen} onValueChange={setValue} value={value}>
          <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(860, 86)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

            <Combobox.Trigger asChild>
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
                  Size: UDim2.fromOffset(320, 40),
                  Text: "",
                }) as Record<string, unknown>)}
              >
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(12, 0)}
                  Size={UDim2.fromOffset(84, 40)}
                  Text="Selected"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <Combobox.Value asChild placeholder="Select option">
                  <textlabel
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(88, 0)}
                    Size={UDim2.fromOffset(212, 40)}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.bodyMd.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Combobox.Value>
              </textbutton>
            </Combobox.Trigger>

            <Combobox.Input asChild placeholder="Type alpha, beta, gamma...">
              <textbox
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(320, 34)}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding PaddingLeft={new UDim(0, theme.space[8])} PaddingRight={new UDim(0, theme.space[8])} />
              </textbox>
            </Combobox.Input>
          </frame>

          <Combobox.Portal>
            <Combobox.Content asChild offset={new Vector2(0, 8)} placement="bottom">
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                  Size: UDim2.fromOffset(320, 128),
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[8])}
                  PaddingLeft={new UDim(0, theme.space[8])}
                  PaddingRight={new UDim(0, theme.space[8])}
                  PaddingTop={new UDim(0, theme.space[8])}
                />
                <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

                <Combobox.Item asChild textValue="alpha" value="alpha">
                  <textbutton
                    {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                      Size: UDim2.fromOffset(300, 30),
                      Text: "alpha",
                    }) as Record<string, unknown>)}
                  >
                    <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
                  </textbutton>
                </Combobox.Item>

                <Combobox.Item asChild textValue="beta" value="beta">
                  <textbutton
                    {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                      Size: UDim2.fromOffset(300, 30),
                      Text: "beta",
                    }) as Record<string, unknown>)}
                  >
                    <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
                  </textbutton>
                </Combobox.Item>

                <Combobox.Item asChild textValue="gamma" value="gamma">
                  <textbutton
                    {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                      Size: UDim2.fromOffset(300, 30),
                      Text: "gamma",
                    }) as Record<string, unknown>)}
                  >
                    <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
                  </textbutton>
                </Combobox.Item>
              </frame>
            </Combobox.Content>
          </Combobox.Portal>
        </Combobox.Root>
      </frame>
    </frame>
  );
}
