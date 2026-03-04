import { React } from "@lattice-ui/core";
import { Slider } from "@lattice-ui/slider";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function SliderBasicScene() {
  const { theme } = useTheme();
  const [horizontalValue, setHorizontalValue] = React.useState(42);
  const [verticalValue, setVerticalValue] = React.useState(68);
  const [lastCommit, setLastCommit] = React.useState("none");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Slider: pointer drag + keyboard(Home/End/Page/Arrows), clamped single-thumb values"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Horizontal: ${math.floor(horizontalValue)} | Vertical: ${math.floor(verticalValue)} | Last commit: ${lastCommit}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 410),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />

        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(12, 12)}
          Size={UDim2.fromOffset(860, 22)}
          Text="Horizontal"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Slider.Root
          max={100}
          min={0}
          onValueChange={setHorizontalValue}
          onValueCommit={(value) => {
            setLastCommit(`horizontal:${math.floor(value)}`);
          }}
          step={1}
          value={horizontalValue}
        >
          <Slider.Track asChild>
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(12, 44)}
              Size={UDim2.fromOffset(420, 12)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.full)} />

              <Slider.Range asChild>
                <frame BackgroundColor3={theme.colors.accent} BorderSizePixel={0}>
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </frame>
              </Slider.Range>

              <Slider.Thumb asChild>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={theme.colors.accentContrast}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(20, 20)}
                  Text=""
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </textbutton>
              </Slider.Thumb>
            </frame>
          </Slider.Track>
        </Slider.Root>

        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(12, 96)}
          Size={UDim2.fromOffset(860, 22)}
          Text="Vertical"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Slider.Root
          max={100}
          min={0}
          onValueChange={setVerticalValue}
          onValueCommit={(value) => {
            setLastCommit(`vertical:${math.floor(value)}`);
          }}
          orientation="vertical"
          step={5}
          value={verticalValue}
        >
          <Slider.Track asChild>
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(24, 126)}
              Size={UDim2.fromOffset(12, 210)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.full)} />

              <Slider.Range asChild>
                <frame BackgroundColor3={theme.colors.accent} BorderSizePixel={0}>
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </frame>
              </Slider.Range>

              <Slider.Thumb asChild>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={theme.colors.accentContrast}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(20, 20)}
                  Text=""
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </textbutton>
              </Slider.Thumb>
            </frame>
          </Slider.Track>
        </Slider.Root>

        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(120, 126)}
          Size={UDim2.fromOffset(740, 22)}
          Text="Disabled"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Slider.Root defaultValue={30} disabled max={100} min={0}>
          <Slider.Track asChild>
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(120, 160)}
              Size={UDim2.fromOffset(320, 10)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.full)} />

              <Slider.Range asChild>
                <frame BackgroundColor3={theme.colors.textSecondary} BorderSizePixel={0}>
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </frame>
              </Slider.Range>

              <Slider.Thumb asChild>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={theme.colors.textSecondary}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(16, 16)}
                  Text=""
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </textbutton>
              </Slider.Thumb>
            </frame>
          </Slider.Track>
        </Slider.Root>
      </frame>

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 500)} Size={UDim2.fromOffset(420, 40)}>
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
            Size: UDim2.fromOffset(120, 36),
            Text: "Set 0/100",
            Event: {
              Activated: () => {
                setHorizontalValue(0);
                setVerticalValue(100);
              },
            },
          }) as Record<string, unknown>)}
        />

        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
            Size: UDim2.fromOffset(120, 36),
            Text: "Set Mid",
            Event: {
              Activated: () => {
                setHorizontalValue(50);
                setVerticalValue(50);
              },
            },
          }) as Record<string, unknown>)}
        />
      </frame>
    </frame>
  );
}
