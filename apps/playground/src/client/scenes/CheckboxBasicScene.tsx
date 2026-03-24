import type { CheckedState } from "@lattice-ui/checkbox";
import { Checkbox } from "@lattice-ui/checkbox";
import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { playgroundIndicatorTransition } from "../motion";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

function toCheckedLabel(value: CheckedState) {
  return value === "indeterminate" ? "indeterminate" : value ? "checked" : "unchecked";
}

export function CheckboxBasicScene() {
  const { theme } = useTheme();
  const [controlled, setControlled] = React.useState<CheckedState>("indeterminate");
  const [uncontrolled, setUncontrolled] = React.useState<CheckedState>("indeterminate");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(860, 28)}
        Text="Checkbox: controlled/uncontrolled, indeterminate -> checked, disabled behavior"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(860, 22)}
        Text={`Controlled: ${toCheckedLabel(controlled)} | Uncontrolled: ${toCheckedLabel(uncontrolled)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 72),
          Size: UDim2.fromOffset(640, 210),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

        <Checkbox.Root asChild checked={controlled} onCheckedChange={setControlled}>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
              Size: UDim2.fromOffset(610, 44),
              Text: "",
            }) as Record<string, unknown>)}
          >
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(12, 10)}
              Size={UDim2.fromOffset(24, 24)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
              <Checkbox.Indicator asChild forceMount transition={playgroundIndicatorTransition}>
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 0)}
                  Size={UDim2.fromScale(1, 1)}
                  Text={controlled === "indeterminate" ? "-" : "✓"}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                />
              </Checkbox.Indicator>
            </frame>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(48, 0)}
              Size={UDim2.fromOffset(540, 44)}
              Text={`Controlled (${toCheckedLabel(controlled)})`}
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </textbutton>
        </Checkbox.Root>

        <Checkbox.Root asChild defaultChecked="indeterminate" onCheckedChange={setUncontrolled}>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
              Size: UDim2.fromOffset(610, 44),
              Text: "",
            }) as Record<string, unknown>)}
          >
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(12, 10)}
              Size={UDim2.fromOffset(24, 24)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
              <Checkbox.Indicator asChild forceMount transition={playgroundIndicatorTransition}>
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 0)}
                  Size={UDim2.fromScale(1, 1)}
                  Text={uncontrolled === "indeterminate" ? "-" : "✓"}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                />
              </Checkbox.Indicator>
            </frame>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(48, 0)}
              Size={UDim2.fromOffset(540, 44)}
              Text={`Uncontrolled (${toCheckedLabel(uncontrolled)})`}
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </textbutton>
        </Checkbox.Root>

        <Checkbox.Root asChild checked={true} disabled>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
              Size: UDim2.fromOffset(610, 44),
              Text: "",
            }) as Record<string, unknown>)}
          >
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(12, 10)}
              Size={UDim2.fromOffset(24, 24)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
              <Checkbox.Indicator asChild transition={playgroundIndicatorTransition}>
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 0)}
                  Size={UDim2.fromScale(1, 1)}
                  Text="✓"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.bodyMd.textSize}
                />
              </Checkbox.Indicator>
            </frame>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(48, 0)}
              Size={UDim2.fromOffset(540, 44)}
              Text="Disabled checked"
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </textbutton>
        </Checkbox.Root>
      </frame>

      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
          Position: UDim2.fromOffset(0, 300),
          Size: UDim2.fromOffset(200, 36),
          Text: "Set Controlled Indeterminate",
          Event: {
            Activated: () => {
              setControlled("indeterminate");
            },
          },
        }) as Record<string, unknown>)}
      />
    </frame>
  );
}
