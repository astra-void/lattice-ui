import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { TextField } from "@lattice-ui/text-field";
import { DocExampleShell } from "./DocExampleShell";

function TextFieldExample() {
  const { theme } = useTheme();

  return (
    <TextField.Root>
      <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

        <TextField.Label asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundTransparency={1}
            BorderSizePixel={0}
            LayoutOrder={1}
            Size={UDim2.fromOffset(300, 18)}
            Text="Email"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </TextField.Label>

        <TextField.Input asChild>
          <textbox
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            LayoutOrder={2}
            PlaceholderText="you@example.com"
            Size={UDim2.fromOffset(300, 36)}
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <uipadding PaddingLeft={new UDim(0, theme.space[10])} PaddingRight={new UDim(0, theme.space[10])} />
          </textbox>
        </TextField.Input>

        <TextField.Description asChild>
          <Text
            BackgroundTransparency={1}
            LayoutOrder={3}
            Size={UDim2.fromOffset(300, 16)}
            Text="We'll never share your email."
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </TextField.Description>
      </frame>
    </TextField.Root>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={82} width={300}>
      <TextFieldExample />
    </DocExampleShell>
  ),
  title: "TextField Example",
} as const;
