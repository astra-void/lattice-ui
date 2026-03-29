import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Toast } from "@lattice-ui/toast";
import { playgroundToastTransition } from "../motion";
import { panelRecipe } from "../theme/recipes";

export function ToastBasicScene() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Toast: declarative composition preview"
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
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

        <Toast.Root asChild transition={playgroundToastTransition}>
          <frame
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            LayoutOrder={1}
            Size={UDim2.fromOffset(360, 72)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uipadding
              PaddingLeft={new UDim(0, theme.space[10])}
              PaddingRight={new UDim(0, theme.space[10])}
              PaddingTop={new UDim(0, theme.space[8])}
            />
            <Toast.Title asChild>
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(300, 20)}
                Text="Saved"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </Toast.Title>
            <Toast.Description asChild>
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 24)}
                Size={UDim2.fromOffset(300, 18)}
                Text="Your preferences were updated."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </Toast.Description>
            <Toast.Close asChild>
              <textbutton
                AutoButtonColor={false}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(320, 2)}
                Size={UDim2.fromOffset(24, 20)}
                Text="X"
                TextColor3={theme.colors.textSecondary}
                TextSize={12}
              />
            </Toast.Close>
          </frame>
        </Toast.Root>

        <Toast.Root asChild transition={playgroundToastTransition}>
          <frame
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            LayoutOrder={2}
            Size={UDim2.fromOffset(360, 72)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uipadding
              PaddingLeft={new UDim(0, theme.space[10])}
              PaddingRight={new UDim(0, theme.space[10])}
              PaddingTop={new UDim(0, theme.space[8])}
            />
            <Toast.Title asChild>
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(300, 20)}
                Text="Network unstable"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </Toast.Title>
            <Toast.Description asChild>
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 24)}
                Size={UDim2.fromOffset(300, 18)}
                Text="Actions are queued and will retry."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </Toast.Description>
          </frame>
        </Toast.Root>
      </frame>
    </frame>
  );
}
