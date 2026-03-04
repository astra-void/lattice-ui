import { Avatar } from "@lattice-ui/avatar";
import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function AvatarBasicScene() {
  const { theme } = useTheme();
  const [useBrokenImage, setUseBrokenImage] = React.useState(false);

  const src = useBrokenImage ? "rbxassetid://0" : "rbxasset://textures/ui/GuiImagePlaceholder.png";

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Avatar: image + delayed fallback"
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

        <Avatar.Root delayMs={250} src={src}>
          <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromOffset(56, 56)}>
            <uicorner CornerRadius={new UDim(1, 0)} />
            <Avatar.Image asChild>
              <imagelabel BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                <uicorner CornerRadius={new UDim(1, 0)} />
              </imagelabel>
            </Avatar.Image>
            <Avatar.Fallback asChild>
              <textlabel
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Size={UDim2.fromScale(1, 1)}
                Text="UI"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
              />
            </Avatar.Fallback>
          </frame>
        </Avatar.Root>

        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
            Position: UDim2.fromOffset(0, 80),
            Size: UDim2.fromOffset(220, 34),
            Text: useBrokenImage ? "Use valid image" : "Use broken image",
            Event: {
              Activated: () => {
                setUseBrokenImage((value) => !value);
              },
            },
          }) as Record<string, unknown>)}
        />
      </frame>
    </frame>
  );
}
