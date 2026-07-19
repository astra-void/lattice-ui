import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { Textarea } from "@lattice-ui/react-textarea";
import { buttonRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function TextareaExample() {
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
          Text="Send feedback"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 22)}
          Size={UDim2.fromOffset(280, 16)}
          Text="Help us improve the component library."
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      <Textarea.Root>
        <frame
          AutomaticSize={Enum.AutomaticSize.Y}
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(280, 0)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

          <Textarea.Label asChild>
            <textbutton
              AutoButtonColor={false}
              BackgroundTransparency={1}
              BorderSizePixel={0}
              Font={Enum.Font.GothamMedium}
              LayoutOrder={0}
              Size={UDim2.fromOffset(280, 16)}
              Text="Message"
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </Textarea.Label>

          <frame
            BackgroundColor3={theme.colors.surface}
            BorderSizePixel={0}
            LayoutOrder={1}
            Size={UDim2.fromOffset(280, 92)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <Textarea.Input asChild>
              <textbox
                BackgroundTransparency={1}
                BorderSizePixel={0}
                ClearTextOnFocus={false}
                PlaceholderColor3={theme.colors.textSecondary}
                PlaceholderText="What worked well? What felt rough?"
                Size={UDim2.fromScale(1, 1)}
                Text=""
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextWrapped
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
              >
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[10])}
                  PaddingLeft={new UDim(0, theme.space[12])}
                  PaddingRight={new UDim(0, theme.space[12])}
                  PaddingTop={new UDim(0, theme.space[10])}
                />
              </textbox>
            </Textarea.Input>
          </frame>

          <Textarea.Description asChild>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={2}
              Size={UDim2.fromOffset(280, 16)}
              Text="Visible to the whole team."
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </Textarea.Description>
        </frame>
      </Textarea.Root>

      <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(280, 46)}>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
            AnchorPoint: new Vector2(1, 1),
            Position: UDim2.fromScale(1, 1),
            Size: UDim2.fromOffset(130, 36),
            Text: "Send feedback",
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
    <DocExampleShell height={282} width={320}>
      <TextareaExample />
    </DocExampleShell>
  ),
  title: "Textarea Example",
} as const;
