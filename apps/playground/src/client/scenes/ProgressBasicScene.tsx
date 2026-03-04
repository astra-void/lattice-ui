import { React } from "@lattice-ui/core";
import { Progress } from "@lattice-ui/progress";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function ProgressBasicScene() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState(35);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Progress + Spinner"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 56),
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

        <Text
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(860, 20)}
          Text={`Value: ${value}`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Progress.Root max={100} value={value}>
          <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} LayoutOrder={2} Size={UDim2.fromOffset(860, 16)}>
            <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
            <Progress.Indicator asChild>
              <frame BackgroundColor3={theme.colors.accent} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
              </frame>
            </Progress.Indicator>
          </frame>
        </Progress.Root>

        <Progress.Spinner asChild spinning>
          <frame BackgroundTransparency={1} BorderSizePixel={0} LayoutOrder={3} Size={UDim2.fromOffset(22, 22)}>
            <uicorner CornerRadius={new UDim(1, 0)} />
            <uistroke Color={theme.colors.accent} Thickness={2} />
          </frame>
        </Progress.Spinner>

        <frame BackgroundTransparency={1} LayoutOrder={4} Size={UDim2.fromOffset(300, 36)}>
          <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
              Text: "-10",
              Event: {
                Activated: () => {
                  setValue((current) => math.max(0, current - 10));
                },
              },
            }) as Record<string, unknown>)}
          />
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
              Text: "+10",
              Event: {
                Activated: () => {
                  setValue((current) => math.min(100, current + 10));
                },
              },
            }) as Record<string, unknown>)}
          />
        </frame>
      </frame>
    </frame>
  );
}
