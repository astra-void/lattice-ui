import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Switch } from "@lattice-ui/switch";

import { panelRecipe } from "../theme/recipes";

function toSwitchLabel(checked: boolean) {
  return checked ? "on" : "off";
}

export function SwitchBasicScene() {
  const { theme } = useTheme();
  const [controlled, setControlled] = React.useState(false);
  const [uncontrolled, setUncontrolled] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(860, 28)}
        Text="Switch: controlled/uncontrolled, Activated toggle, disabled behavior"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(860, 22)}
        Text={`Controlled: ${toSwitchLabel(controlled)} | Uncontrolled: ${toSwitchLabel(uncontrolled)}`}
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

        <frame BackgroundTransparency={1} Size={UDim2.fromOffset(610, 44)}>
          <Switch.Root asChild checked={controlled} onCheckedChange={setControlled}>
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(12, 10)}
              Size={UDim2.fromOffset(46, 24)}
              Text=""
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <Switch.Thumb asChild>
                <frame
                  BackgroundColor3={theme.colors.accentContrast}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(20, 20)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(68, 0)}
            Size={UDim2.fromOffset(530, 44)}
            Text={`Controlled (${toSwitchLabel(controlled)})`}
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </frame>

        <frame BackgroundTransparency={1} Size={UDim2.fromOffset(610, 44)}>
          <Switch.Root asChild defaultChecked={true} onCheckedChange={setUncontrolled}>
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(12, 10)}
              Size={UDim2.fromOffset(46, 24)}
              Text=""
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <Switch.Thumb asChild>
                <frame
                  BackgroundColor3={theme.colors.accentContrast}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(20, 20)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(68, 0)}
            Size={UDim2.fromOffset(530, 44)}
            Text={`Uncontrolled (${toSwitchLabel(uncontrolled)})`}
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </frame>

        <frame BackgroundTransparency={1} Size={UDim2.fromOffset(610, 44)}>
          <Switch.Root asChild checked={true} disabled>
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(12, 10)}
              Size={UDim2.fromOffset(46, 24)}
              Text=""
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <Switch.Thumb asChild>
                <frame
                  BackgroundColor3={theme.colors.textSecondary}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(20, 20)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(68, 0)}
            Size={UDim2.fromOffset(530, 44)}
            Text="Disabled on"
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </frame>
      </frame>
    </frame>
  );
}
