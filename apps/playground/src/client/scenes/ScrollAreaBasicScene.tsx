import { React } from "@lattice-ui/core";
import { ScrollArea } from "@lattice-ui/scroll-area";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { panelRecipe } from "../theme/recipes";

export function ScrollAreaBasicScene() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="ScrollArea: custom viewport + horizontal/vertical scrollbars"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 56),
          Size: UDim2.fromOffset(900, 360),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />

        <ScrollArea.Root>
          <frame BackgroundTransparency={1} Size={UDim2.fromOffset(520, 220)}>
            <ScrollArea.Viewport asChild>
              <scrollingframe
                AutomaticCanvasSize={Enum.AutomaticSize.None}
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                CanvasSize={UDim2.fromOffset(960, 520)}
                ScrollBarImageTransparency={1}
                ScrollBarThickness={0}
                ScrollingDirection={Enum.ScrollingDirection.XY}
                Size={UDim2.fromOffset(480, 180)}
              >
                <frame BackgroundColor3={theme.colors.accent} BorderSizePixel={0} Position={UDim2.fromOffset(32, 32)} Size={UDim2.fromOffset(360, 120)} />
                <frame BackgroundColor3={theme.colors.danger} BorderSizePixel={0} Position={UDim2.fromOffset(620, 320)} Size={UDim2.fromOffset(280, 140)} />
              </scrollingframe>
            </ScrollArea.Viewport>

            <ScrollArea.Scrollbar asChild orientation="vertical">
              <frame BackgroundColor3={theme.colors.border} BorderSizePixel={0} Position={UDim2.fromOffset(484, 0)} Size={UDim2.fromOffset(8, 180)}>
                <ScrollArea.Thumb asChild orientation="vertical">
                  <frame BackgroundColor3={theme.colors.textSecondary} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                    <uicorner CornerRadius={new UDim(1, 0)} />
                  </frame>
                </ScrollArea.Thumb>
              </frame>
            </ScrollArea.Scrollbar>

            <ScrollArea.Scrollbar asChild orientation="horizontal">
              <frame BackgroundColor3={theme.colors.border} BorderSizePixel={0} Position={UDim2.fromOffset(0, 184)} Size={UDim2.fromOffset(480, 8)}>
                <ScrollArea.Thumb asChild orientation="horizontal">
                  <frame BackgroundColor3={theme.colors.textSecondary} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                    <uicorner CornerRadius={new UDim(1, 0)} />
                  </frame>
                </ScrollArea.Thumb>
              </frame>
            </ScrollArea.Scrollbar>

            <ScrollArea.Corner asChild>
              <frame BackgroundColor3={theme.colors.border} BorderSizePixel={0} Position={UDim2.fromOffset(484, 184)} Size={UDim2.fromOffset(8, 8)} />
            </ScrollArea.Corner>
          </frame>
        </ScrollArea.Root>
      </frame>
    </frame>
  );
}
