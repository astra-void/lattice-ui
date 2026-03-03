import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { ToggleGroup, ToggleGroupItem } from "@lattice-ui/toggle-group";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

function formatValue(value: string | undefined) {
  return value ?? "none";
}

export function ToggleGroupRovingScene() {
  const { theme } = useTheme();
  const [horizontalValue, setHorizontalValue] = React.useState<string | undefined>("one");
  const [verticalValue, setVerticalValue] = React.useState<string | undefined>("alpha");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="ToggleGroup roving: arrow/Home/End moves focus only; selection changes on Activated or Enter/Space."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Horizontal(loop=true): ${formatValue(horizontalValue)} | Vertical(loop=false): ${formatValue(verticalValue)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 450),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />

        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(12, 10)}
          Size={UDim2.fromOffset(860, 20)}
          Text="Horizontal (loop=true, orientation=horizontal)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <ToggleGroup
          loop
          onValueChange={setHorizontalValue}
          orientation="horizontal"
          type="single"
          value={horizontalValue}
        >
          <frame BackgroundTransparency={1} Position={UDim2.fromOffset(12, 38)} Size={UDim2.fromOffset(860, 40)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroupItem asChild value="one">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: horizontalValue === "one" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "One",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroupItem>

            <ToggleGroupItem asChild disabled value="two">
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Active: false,
                  Selectable: false,
                  Size: UDim2.fromOffset(170, 34),
                  Text: "Two (Disabled)",
                  TextColor3: theme.colors.textSecondary,
                }) as Record<string, unknown>)}
              />
            </ToggleGroupItem>

            <ToggleGroupItem asChild value="three">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: horizontalValue === "three" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Three",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroupItem>
          </frame>
        </ToggleGroup>

        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(12, 108)}
          Size={UDim2.fromOffset(860, 20)}
          Text="Vertical (loop=false, orientation=vertical, disabled skip)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <ToggleGroup
          loop={false}
          onValueChange={setVerticalValue}
          orientation="vertical"
          type="single"
          value={verticalValue}
        >
          <frame BackgroundTransparency={1} Position={UDim2.fromOffset(12, 136)} Size={UDim2.fromOffset(360, 220)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroupItem asChild value="alpha">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: verticalValue === "alpha" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(320, 34),
                    Text: "Alpha",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroupItem>

            <ToggleGroupItem asChild disabled value="beta">
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Active: false,
                  Selectable: false,
                  Size: UDim2.fromOffset(320, 34),
                  Text: "Beta (Disabled)",
                  TextColor3: theme.colors.textSecondary,
                }) as Record<string, unknown>)}
              />
            </ToggleGroupItem>

            <ToggleGroupItem asChild value="gamma">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: verticalValue === "gamma" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(320, 34),
                    Text: "Gamma",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroupItem>
          </frame>
        </ToggleGroup>
      </frame>
    </frame>
  );
}
