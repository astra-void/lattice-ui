import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { Switch } from "@lattice-ui/switch";
import { DocExampleShell } from "./DocExampleShell";

function SwitchExample() {
  const { theme } = useTheme();
  const [airplaneMode, setAirplaneMode] = React.useState(false);
  const [wifi, setWifi] = React.useState(true);

  const rows: Array<{
    label: string;
    checked: boolean;
    onChange: (next: boolean) => void;
  }> = [
    { label: "Airplane Mode", checked: airplaneMode, onChange: setAirplaneMode },
    { label: "Wi-Fi", checked: wifi, onChange: setWifi },
  ];

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />
      {rows.map((row) => (
        <frame BackgroundTransparency={1} key={row.label} Size={UDim2.fromOffset(280, 28)}>
          <Switch.Root
            asChild
            checked={row.checked}
            onCheckedChange={row.onChange}
            trackColorMode="switch"
            trackOffColor={theme.colors.surfaceElevated}
            trackOnColor={theme.colors.accent}
          >
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 2)}
              Size={UDim2.fromOffset(46, 24)}
              Text=""
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <Switch.Thumb asChild>
                <frame BackgroundColor3={theme.colors.accentContrast} BorderSizePixel={0} Size={UDim2.fromOffset(20, 20)}>
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(58, 0)}
            Size={UDim2.fromOffset(220, 28)}
            Text={row.label}
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </frame>
      ))}
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={66} width={280}>
      <SwitchExample />
    </DocExampleShell>
  ),
  title: "Switch Example",
} as const;
