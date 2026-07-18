import type { CheckedState } from "@lattice-ui/checkbox";
import { Checkbox } from "@lattice-ui/checkbox";
import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function CheckboxExample() {
  const { theme } = useTheme();
  const [terms, setTerms] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);

  const rows: Array<{
    label: string;
    checked: boolean;
    disabled?: boolean;
    onChange?: (state: CheckedState) => void;
  }> = [
    {
      label: "Accept terms and conditions",
      checked: terms,
      onChange: (state) => setTerms(state === true),
    },
    {
      label: "Send me marketing emails",
      checked: marketing,
      onChange: (state) => setMarketing(state === true),
    },
    { label: "Sync usage data", checked: true, disabled: true },
  ];

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />
      {rows.map((row) => (
        <Checkbox.Root
          asChild
          checked={row.checked}
          disabled={row.disabled}
          key={row.label}
          onCheckedChange={row.onChange}
        >
          <textbutton
            Active={!row.disabled}
            AutoButtonColor={false}
            BackgroundTransparency={1}
            Selectable={!row.disabled}
            Size={UDim2.fromOffset(280, 24)}
            Text=""
          >
            <frame
              BackgroundColor3={row.checked ? theme.colors.accent : theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 2)}
              Size={UDim2.fromOffset(20, 20)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
              <uistroke Color={row.checked ? theme.colors.accent : theme.colors.border} Thickness={1} />
              <Checkbox.Indicator asChild>
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromScale(1, 1)}
                  Text="✓"
                  TextColor3={theme.colors.accentContrast}
                  TextSize={theme.typography.labelSm.textSize}
                />
              </Checkbox.Indicator>
            </frame>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(30, 0)}
              Size={UDim2.fromOffset(250, 24)}
              Text={row.label}
              TextColor3={row.disabled ? theme.colors.textSecondary : theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </textbutton>
        </Checkbox.Root>
      ))}
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={92} width={280}>
      <CheckboxExample />
    </DocExampleShell>
  ),
  title: "Checkbox Example",
} as const;
