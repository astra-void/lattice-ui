import { React } from "@lattice-ui/core";
import { RadioGroup, RadioGroupIndicator, RadioGroupItem } from "@lattice-ui/radio-group";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function RadioGroupRovingScene() {
  const { theme } = useTheme();
  const [verticalValue, setVerticalValue] = React.useState("alpha");
  const [horizontalValue, setHorizontalValue] = React.useState("one");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(900, 28)}
        Text="RadioGroup roving: Up/Down/Left/Right/Home/End focus moves and selection follows immediately."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(900, 22)}
        Text={`Vertical: ${verticalValue} | Horizontal: ${horizontalValue}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 72),
          Size: UDim2.fromOffset(690, 460),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />

        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(12, 10)}
          Size={UDim2.fromOffset(620, 20)}
          Text="Vertical (loop=true, orientation=vertical)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <RadioGroup loop onValueChange={setVerticalValue} orientation="vertical" value={verticalValue}>
          <frame BackgroundTransparency={1} Position={UDim2.fromOffset(12, 34)} Size={UDim2.fromOffset(300, 150)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

            <RadioGroupItem asChild value="alpha">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: verticalValue === "alpha" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(260, 36),
                    Text: "",
                  },
                ) as Record<string, unknown>)}
              >
                <frame
                  BackgroundColor3={theme.colors.surfaceElevated}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(10, 10)}
                  Size={UDim2.fromOffset(16, 16)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                  <RadioGroupIndicator asChild forceMount>
                    <frame
                      BackgroundColor3={theme.colors.textPrimary}
                      BorderSizePixel={0}
                      Position={UDim2.fromOffset(4, 4)}
                      Size={UDim2.fromOffset(8, 8)}
                    >
                      <uicorner CornerRadius={new UDim(1, 0)} />
                    </frame>
                  </RadioGroupIndicator>
                </frame>
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(34, 0)}
                  Size={UDim2.fromOffset(210, 36)}
                  Text="Alpha"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </textbutton>
            </RadioGroupItem>

            <RadioGroupItem asChild value="beta">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: verticalValue === "beta" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(260, 36),
                    Text: "",
                  },
                ) as Record<string, unknown>)}
              >
                <frame
                  BackgroundColor3={theme.colors.surfaceElevated}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(10, 10)}
                  Size={UDim2.fromOffset(16, 16)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                  <RadioGroupIndicator asChild forceMount>
                    <frame
                      BackgroundColor3={theme.colors.textPrimary}
                      BorderSizePixel={0}
                      Position={UDim2.fromOffset(4, 4)}
                      Size={UDim2.fromOffset(8, 8)}
                    >
                      <uicorner CornerRadius={new UDim(1, 0)} />
                    </frame>
                  </RadioGroupIndicator>
                </frame>
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(34, 0)}
                  Size={UDim2.fromOffset(210, 36)}
                  Text="Beta"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </textbutton>
            </RadioGroupItem>

            <RadioGroupItem asChild value="gamma">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: verticalValue === "gamma" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(260, 36),
                    Text: "",
                  },
                ) as Record<string, unknown>)}
              >
                <frame
                  BackgroundColor3={theme.colors.surfaceElevated}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(10, 10)}
                  Size={UDim2.fromOffset(16, 16)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                  <RadioGroupIndicator asChild forceMount>
                    <frame
                      BackgroundColor3={theme.colors.textPrimary}
                      BorderSizePixel={0}
                      Position={UDim2.fromOffset(4, 4)}
                      Size={UDim2.fromOffset(8, 8)}
                    >
                      <uicorner CornerRadius={new UDim(1, 0)} />
                    </frame>
                  </RadioGroupIndicator>
                </frame>
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(34, 0)}
                  Size={UDim2.fromOffset(210, 36)}
                  Text="Gamma"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </textbutton>
            </RadioGroupItem>
          </frame>
        </RadioGroup>

        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(12, 214)}
          Size={UDim2.fromOffset(640, 20)}
          Text="Horizontal (loop=false, orientation=horizontal)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <RadioGroup loop={false} onValueChange={setHorizontalValue} orientation="horizontal" value={horizontalValue}>
          <frame BackgroundTransparency={1} Position={UDim2.fromOffset(12, 238)} Size={UDim2.fromOffset(650, 44)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <RadioGroupItem asChild value="one">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: horizontalValue === "one" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 36),
                    Text: "One",
                  },
                ) as Record<string, unknown>)}
              />
            </RadioGroupItem>

            <RadioGroupItem asChild value="two">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: horizontalValue === "two" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 36),
                    Text: "Two",
                  },
                ) as Record<string, unknown>)}
              />
            </RadioGroupItem>

            <RadioGroupItem asChild value="three">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: horizontalValue === "three" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 36),
                    Text: "Three",
                  },
                ) as Record<string, unknown>)}
              />
            </RadioGroupItem>
          </frame>
        </RadioGroup>
      </frame>
    </frame>
  );
}
