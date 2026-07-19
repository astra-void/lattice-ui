import { React } from "@lattice-ui/react-runtime";
import { Text, useTheme } from "@lattice-ui/react-style";
import { Switch } from "@lattice-ui/react-switch";
import { DocExampleShell } from "./DocExampleShell";

type SettingRow = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

function SwitchExample() {
  const { theme } = useTheme();
  const [airplaneMode, setAirplaneMode] = React.useState(false);
  const [wifi, setWifi] = React.useState(true);
  const [bluetooth, setBluetooth] = React.useState(true);

  const rows: Array<SettingRow> = [
    {
      label: "Airplane Mode",
      description: "Disable all wireless connections.",
      checked: airplaneMode,
      onChange: setAirplaneMode,
    },
    {
      label: "Wi-Fi",
      description: "Astra-Guest · connected",
      checked: wifi,
      onChange: setWifi,
    },
    {
      label: "Bluetooth",
      description: "Visible to nearby devices.",
      checked: bluetooth,
      onChange: setBluetooth,
    },
  ];

  return (
    <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
      <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[16])}
        PaddingLeft={new UDim(0, theme.space[20])}
        PaddingRight={new UDim(0, theme.space[20])}
        PaddingTop={new UDim(0, theme.space[16])}
      />
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

      <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(280, 40)}>
        <Text
          BackgroundTransparency={1}
          Font={Enum.Font.GothamBold}
          Size={UDim2.fromOffset(280, 18)}
          Text="Quick settings"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 22)}
          Size={UDim2.fromOffset(280, 16)}
          Text="Manage device connectivity."
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      {rows.map((row, index) => (
        <frame BackgroundTransparency={1} key={row.label} LayoutOrder={index + 1} Size={UDim2.fromOffset(280, 44)}>
          <Text
            BackgroundTransparency={1}
            Font={Enum.Font.GothamMedium}
            Position={UDim2.fromOffset(0, 3)}
            Size={UDim2.fromOffset(210, 18)}
            Text={row.label}
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, 23)}
            Size={UDim2.fromOffset(210, 16)}
            Text={row.description}
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Switch.Root
            asChild
            checked={row.checked}
            onCheckedChange={row.onChange}
            trackColorMode="switch"
            trackOffColor={theme.colors.surface}
            trackOnColor={theme.colors.accent}
          >
            <textbutton
              AnchorPoint={new Vector2(1, 0.5)}
              AutoButtonColor={false}
              BackgroundColor3={theme.colors.surface}
              BorderSizePixel={0}
              Position={new UDim2(1, 0, 0.5, 0)}
              Size={UDim2.fromOffset(44, 24)}
              Text=""
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <uistroke Color={theme.colors.border} Thickness={1} Transparency={row.checked ? 1 : 0} />
              <Switch.Thumb asChild>
                <frame
                  BackgroundColor3={theme.colors.accentContrast}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(18, 18)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>
        </frame>
      ))}
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={236} width={320}>
      <SwitchExample />
    </DocExampleShell>
  ),
  title: "Switch Example",
} as const;
