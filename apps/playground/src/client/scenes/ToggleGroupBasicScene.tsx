import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { ToggleGroup } from "@lattice-ui/toggle-group";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

function formatSingleValue(value: string | undefined) {
  return value ?? "none";
}

function formatMultipleValue(value: string[]) {
  return value.size() > 0 ? value.join(", ") : "none";
}

export function ToggleGroupBasicScene() {
  const { theme } = useTheme();

  const [singleControlled, setSingleControlled] = React.useState<string | undefined>("alpha");
  const [singleUncontrolledMirror, setSingleUncontrolledMirror] = React.useState<string | undefined>("beta");

  const [multipleControlled, setMultipleControlled] = React.useState<Array<string>>(["bold"]);
  const [multipleUncontrolledMirror, setMultipleUncontrolledMirror] = React.useState<Array<string>>(["left"]);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(960, 620)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(930, 28)}
        Text="ToggleGroup basic: single/multiple controlled + uncontrolled, single re-click clears selection."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(930, 24)}
        Text={`single(controlled)=${formatSingleValue(singleControlled)} | single(uncontrolled)=${formatSingleValue(singleUncontrolledMirror)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 58)}
        Size={UDim2.fromOffset(930, 24)}
        Text={`multiple(controlled)=${formatMultipleValue(multipleControlled)} | multiple(uncontrolled)=${formatMultipleValue(multipleUncontrolledMirror)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 94),
          Size: UDim2.fromOffset(920, 500),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

        <Text
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(860, 20)}
          Text="Single - controlled (click selected again to clear to none)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <ToggleGroup.Root onValueChange={setSingleControlled} type="single" value={singleControlled}>
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(860, 38)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroup.Item asChild value="alpha">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: singleControlled === "alpha" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Alpha",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="beta">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: singleControlled === "beta" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Beta",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="gamma">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: singleControlled === "gamma" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Gamma",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>
          </frame>
        </ToggleGroup.Root>

        <Text
          BackgroundTransparency={1}
          LayoutOrder={3}
          Size={UDim2.fromOffset(860, 20)}
          Text="Single - uncontrolled"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <ToggleGroup.Root defaultValue="beta" onValueChange={setSingleUncontrolledMirror} type="single">
          <frame BackgroundTransparency={1} LayoutOrder={4} Size={UDim2.fromOffset(860, 38)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroup.Item asChild value="alpha">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: singleUncontrolledMirror === "alpha" ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Alpha",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="beta">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: singleUncontrolledMirror === "beta" ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Beta",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="gamma">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: singleUncontrolledMirror === "gamma" ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Gamma",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>
          </frame>
        </ToggleGroup.Root>

        <Text
          BackgroundTransparency={1}
          LayoutOrder={5}
          Size={UDim2.fromOffset(860, 20)}
          Text="Multiple - controlled"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <ToggleGroup.Root onValueChange={setMultipleControlled} type="multiple" value={multipleControlled}>
          <frame BackgroundTransparency={1} LayoutOrder={6} Size={UDim2.fromOffset(860, 38)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroup.Item asChild value="bold">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleControlled.includes("bold") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Bold",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="italic">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleControlled.includes("italic") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Italic",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="underline">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleControlled.includes("underline") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Underline",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>
          </frame>
        </ToggleGroup.Root>

        <Text
          BackgroundTransparency={1}
          LayoutOrder={7}
          Size={UDim2.fromOffset(860, 20)}
          Text="Multiple - uncontrolled"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <ToggleGroup.Root defaultValue={["left"]} onValueChange={setMultipleUncontrolledMirror} type="multiple">
          <frame BackgroundTransparency={1} LayoutOrder={8} Size={UDim2.fromOffset(860, 38)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

            <ToggleGroup.Item asChild value="left">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleUncontrolledMirror.includes("left") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Left",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="center">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleUncontrolledMirror.includes("center") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Center",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>

            <ToggleGroup.Item asChild value="right">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe(
                    { intent: multipleUncontrolledMirror.includes("right") ? "primary" : "surface", size: "sm" },
                    theme,
                  ),
                  {
                    Size: UDim2.fromOffset(170, 34),
                    Text: "Right",
                  },
                ) as Record<string, unknown>)}
              />
            </ToggleGroup.Item>
          </frame>
        </ToggleGroup.Root>
      </frame>
    </frame>
  );
}
