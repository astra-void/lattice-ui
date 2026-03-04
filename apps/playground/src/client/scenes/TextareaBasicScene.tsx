import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Textarea } from "@lattice-ui/textarea";
import { panelRecipe } from "../theme/recipes";

export function TextareaBasicScene() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState("line 1\nline 2");

  const invalid = value.size() < 5;

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Textarea: multi-line input with auto-resize"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 52),
          Size: UDim2.fromOffset(900, 260),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />

        <Textarea.Root invalid={invalid} onValueChange={setValue} value={value}>
          <frame BackgroundTransparency={1} Size={UDim2.fromOffset(860, 220)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

            <Textarea.Label asChild>
              <textbutton
                AutoButtonColor={false}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(860, 22)}
                Text="Notes"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </Textarea.Label>

            <Textarea.Input asChild>
              <textbox
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                PlaceholderText="Write details"
                Size={UDim2.fromOffset(860, 70)}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextWrapped
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[8])}
                  PaddingLeft={new UDim(0, theme.space[8])}
                  PaddingRight={new UDim(0, theme.space[8])}
                  PaddingTop={new UDim(0, theme.space[8])}
                />
              </textbox>
            </Textarea.Input>

            <Textarea.Description asChild>
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(860, 16)}
                Text="Default minRows=3, maxRows optional"
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </Textarea.Description>

            <Textarea.Message asChild>
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(860, 16)}
                Text={invalid ? "Type at least 5 chars" : "Looks good"}
                TextColor3={invalid ? theme.colors.danger : theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </Textarea.Message>
          </frame>
        </Textarea.Root>
      </frame>
    </frame>
  );
}
