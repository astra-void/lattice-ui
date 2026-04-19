import { React } from "@lattice-ui/core";
import { Select } from "@lattice-ui/select";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";

import { buttonRecipe, menuItemRecipe, panelRecipe } from "../theme/recipes";

export function SelectBasicScene() {
  const { theme } = useTheme();
  const [controlledOpen, setControlledOpen] = React.useState(false);
  const [controlledValue, setControlledValue] = React.useState("alpha");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Select: single choice with controlled state and outside dismiss"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Controlled open: ${controlledOpen ? "true" : "false"} | Controlled value: ${controlledValue}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 420),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[20])} />

        <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(860, 170)}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <Text
            BackgroundTransparency={1}
            Size={UDim2.fromOffset(860, 22)}
            Text="Controlled Select"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />

          <Select.Root
            onOpenChange={setControlledOpen}
            onValueChange={setControlledValue}
            open={controlledOpen}
            value={controlledValue}
          >
            <Select.Trigger asChild>
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
                  Text="Mode"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <Select.Value asChild placeholder="Pick a mode">
                  <textlabel
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(88, 0)}
                    Size={UDim2.fromOffset(200, 40)}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.bodyMd.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Select.Value>
              </textbutton>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content asChild sideOffset={8} placement="bottom">
                <frame
                  {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                    Size: UDim2.fromOffset(320, 176),
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uipadding
                    PaddingBottom={new UDim(0, theme.space[8])}
                    PaddingLeft={new UDim(0, theme.space[8])}
                    PaddingRight={new UDim(0, theme.space[8])}
                    PaddingTop={new UDim(0, theme.space[8])}
                  />
                  <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

                  <Select.Label asChild>
                    <Text
                      BackgroundTransparency={1}
                      Size={UDim2.fromOffset(300, 18)}
                      Text="Available Modes"
                      TextColor3={theme.colors.textSecondary}
                      TextSize={theme.typography.labelSm.textSize}
                      TextXAlignment={Enum.TextXAlignment.Left}
                    />
                  </Select.Label>

                  <Select.Group asChild>
                    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(300, 104)}>
                      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

                      <Select.Item asChild textValue="alpha" value="alpha">
                        <textbutton
                          {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                            Size: UDim2.fromOffset(300, 30),
                            Text: "alpha",
                          }) as Record<string, unknown>)}
                        >
                          <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                        </textbutton>
                      </Select.Item>

                      <Select.Item asChild textValue="beta" value="beta">
                        <textbutton
                          {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                            Size: UDim2.fromOffset(300, 30),
                            Text: "beta",
                          }) as Record<string, unknown>)}
                        >
                          <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                        </textbutton>
                      </Select.Item>

                      <Select.Item asChild disabled textValue="gamma" value="gamma">
                        <textbutton
                          {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "true" }, theme), {
                            Size: UDim2.fromOffset(300, 30),
                            Text: "gamma (Disabled)",
                          }) as Record<string, unknown>)}
                        >
                          <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                        </textbutton>
                      </Select.Item>
                    </frame>
                  </Select.Group>

                  <Select.Separator asChild>
                    <frame BackgroundColor3={theme.colors.border} BorderSizePixel={0} Size={UDim2.fromOffset(300, 1)} />
                  </Select.Separator>
                </frame>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </frame>

        <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(860, 140)}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <Text
            BackgroundTransparency={1}
            Size={UDim2.fromOffset(860, 22)}
            Text="Uncontrolled Select"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />

          <Select.Root defaultValue="beta">
            <Select.Trigger asChild>
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
                  Text="Quality"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <Select.Value asChild placeholder="Pick quality">
                  <textlabel
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(88, 0)}
                    Size={UDim2.fromOffset(200, 40)}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.bodyMd.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Select.Value>
              </textbutton>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content asChild sideOffset={8} placement="bottom">
                <frame
                  {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                    Size: UDim2.fromOffset(320, 126),
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

                  <Select.Item asChild textValue="low" value="low">
                    <textbutton
                      {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                        Size: UDim2.fromOffset(300, 30),
                        Text: "low",
                      }) as Record<string, unknown>)}
                    >
                      <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                    </textbutton>
                  </Select.Item>

                  <Select.Item asChild textValue="beta" value="beta">
                    <textbutton
                      {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                        Size: UDim2.fromOffset(300, 30),
                        Text: "beta",
                      }) as Record<string, unknown>)}
                    >
                      <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                    </textbutton>
                  </Select.Item>

                  <Select.Item asChild textValue="high" value="high">
                    <textbutton
                      {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                        Size: UDim2.fromOffset(300, 30),
                        Text: "high",
                      }) as Record<string, unknown>)}
                    >
                      <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                    </textbutton>
                  </Select.Item>
                </frame>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </frame>
      </frame>
    </frame>
  );
}
