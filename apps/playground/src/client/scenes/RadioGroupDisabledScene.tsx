import { React } from "@lattice-ui/core";
import { RadioGroup } from "@lattice-ui/radio-group";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function RadioGroupDisabledScene() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState("file");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(900, 28)}
        Text="RadioGroup disabled: disabled item skip + group disabled"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(900, 22)}
        Text={`Selected: ${value}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 72),
          Size: UDim2.fromOffset(640, 250),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(580, 20)}
          Text="Partial disabled (middle item is disabled and should be skipped)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <RadioGroup.Root onValueChange={setValue} value={value}>
          <frame BackgroundTransparency={1} Size={UDim2.fromOffset(580, 124)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

            <RadioGroup.Item asChild value="file">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: value === "file" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(300, 34),
                    Text: "File",
                  },
                ) as Record<string, unknown>)}
              />
            </RadioGroup.Item>

            <RadioGroup.Item asChild disabled value="edit">
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Active: false,
                  Selectable: false,
                  Size: UDim2.fromOffset(300, 34),
                  Text: "Edit (Disabled)",
                  TextColor3: theme.colors.textSecondary,
                }) as Record<string, unknown>)}
              />
            </RadioGroup.Item>

            <RadioGroup.Item asChild value="view">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: value === "view" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(300, 34),
                    Text: "View",
                  },
                ) as Record<string, unknown>)}
              />
            </RadioGroup.Item>
          </frame>
        </RadioGroup.Root>

        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(580, 20)}
          Text="Group disabled (selection stays fixed)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <RadioGroup.Root defaultValue="fixed" disabled orientation="horizontal">
          <frame BackgroundTransparency={1} Size={UDim2.fromOffset(580, 34)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[6])} />

            <RadioGroup.Item asChild value="fixed">
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Active: false,
                  Selectable: false,
                  Size: UDim2.fromOffset(150, 34),
                  Text: "Fixed",
                  TextColor3: theme.colors.textSecondary,
                }) as Record<string, unknown>)}
              />
            </RadioGroup.Item>

            <RadioGroup.Item asChild value="other">
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Active: false,
                  Selectable: false,
                  Size: UDim2.fromOffset(150, 34),
                  Text: "Other",
                  TextColor3: theme.colors.textSecondary,
                }) as Record<string, unknown>)}
              />
            </RadioGroup.Item>
          </frame>
        </RadioGroup.Root>
      </frame>
    </frame>
  );
}
