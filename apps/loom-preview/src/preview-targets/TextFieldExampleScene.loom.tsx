import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { TextField } from "@lattice-ui/react-text-field";
import { buttonRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function TextFieldExample() {
  const { theme } = useTheme();

  return (
    <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
      <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[20])}
        PaddingLeft={new UDim(0, theme.space[20])}
        PaddingRight={new UDim(0, theme.space[20])}
        PaddingTop={new UDim(0, theme.space[20])}
      />
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

      <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(280, 48)}>
        <Text
          BackgroundTransparency={1}
          Font={Enum.Font.GothamBold}
          Size={UDim2.fromOffset(280, 18)}
          Text="Join the newsletter"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 22)}
          Size={UDim2.fromOffset(280, 16)}
          Text="Product updates, once a month."
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      <TextField.Root>
        <frame
          AutomaticSize={Enum.AutomaticSize.Y}
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(280, 0)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

          <TextField.Label asChild>
            <textbutton
              AutoButtonColor={false}
              BackgroundTransparency={1}
              BorderSizePixel={0}
              Font={Enum.Font.GothamMedium}
              LayoutOrder={0}
              Size={UDim2.fromOffset(280, 16)}
              Text="Email"
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </TextField.Label>

          <frame
            BackgroundColor3={theme.colors.surface}
            BorderSizePixel={0}
            LayoutOrder={1}
            Size={UDim2.fromOffset(280, 40)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <TextField.Input asChild>
              <textbox
                BackgroundTransparency={1}
                BorderSizePixel={0}
                PlaceholderColor3={theme.colors.textSecondary}
                PlaceholderText="you@example.com"
                Size={UDim2.fromScale(1, 1)}
                Text=""
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uipadding PaddingLeft={new UDim(0, theme.space[12])} PaddingRight={new UDim(0, theme.space[12])} />
              </textbox>
            </TextField.Input>
          </frame>

          <TextField.Description asChild>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={2}
              Size={UDim2.fromOffset(280, 16)}
              Text="No spam — unsubscribe anytime."
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </TextField.Description>
        </frame>
      </TextField.Root>

      <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(280, 48)}>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
            AnchorPoint: new Vector2(0, 1),
            Position: UDim2.fromScale(0, 1),
            Size: UDim2.fromOffset(280, 38),
            Text: "Subscribe",
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
    <DocExampleShell height={232} width={320}>
      <TextFieldExample />
    </DocExampleShell>
  ),
  title: "TextField Example",
} as const;
