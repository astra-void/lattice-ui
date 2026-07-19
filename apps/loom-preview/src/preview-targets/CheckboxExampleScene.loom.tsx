import type { CheckedState } from "@lattice-ui/react-checkbox";
import { Checkbox } from "@lattice-ui/react-checkbox";
import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { buttonRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

type PreferenceRow = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (state: CheckedState) => void;
};

function CheckboxExample() {
  const { theme } = useTheme();
  const [updates, setUpdates] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);

  const rows: Array<PreferenceRow> = [
    {
      label: "Product updates",
      description: "Feature news and improvements.",
      checked: updates,
      onChange: (state) => setUpdates(state === true),
    },
    {
      label: "Marketing",
      description: "Tips, offers, and event invites.",
      checked: marketing,
      onChange: (state) => setMarketing(state === true),
    },
    {
      label: "Security alerts",
      description: "Important notices about your account.",
      checked: true,
      disabled: true,
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
          Text="Email preferences"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 22)}
          Size={UDim2.fromOffset(280, 16)}
          Text="Choose which emails you receive."
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      {rows.map((row, index) => (
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
            LayoutOrder={index + 1}
            Selectable={!row.disabled}
            Size={UDim2.fromOffset(280, 40)}
            Text=""
          >
            <frame
              BackgroundColor3={row.checked ? theme.colors.accent : theme.colors.surfaceElevated}
              BackgroundTransparency={row.disabled ? 0.5 : 0}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 3)}
              Size={UDim2.fromOffset(20, 20)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
              <uistroke
                Color={row.checked ? theme.colors.accent : theme.colors.border}
                Thickness={1}
                Transparency={row.disabled ? 0.5 : 0}
              />
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
              Font={Enum.Font.GothamMedium}
              Position={UDim2.fromOffset(32, 2)}
              Size={UDim2.fromOffset(248, 18)}
              Text={row.label}
              TextColor3={row.disabled ? theme.colors.textSecondary : theme.colors.textPrimary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(32, 22)}
              Size={UDim2.fromOffset(248, 16)}
              Text={row.description}
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </textbutton>
        </Checkbox.Root>
      ))}

      <frame BackgroundTransparency={1} LayoutOrder={4} Size={UDim2.fromOffset(280, 40)}>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
            AnchorPoint: new Vector2(1, 1),
            Position: UDim2.fromScale(1, 1),
            Size: UDim2.fromOffset(140, 36),
            Text: "Save preferences",
            TextSize: theme.typography.labelSm.textSize,
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
        </textbutton>
      </frame>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={272} width={320}>
      <CheckboxExample />
    </DocExampleShell>
  ),
  title: "Checkbox Example",
} as const;
