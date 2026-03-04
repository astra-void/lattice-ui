import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { TextField } from "@lattice-ui/text-field";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function TextFieldBasicScene() {
  const { theme } = useTheme();
  const [controlledValue, setControlledValue] = React.useState("hello");
  const [lastCommit, setLastCommit] = React.useState("none");
  const [commitCount, setCommitCount] = React.useState(0);

  const invalid = controlledValue.size() < 3;

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="TextField: controlled/uncontrolled, commit callback, readOnly/disabled state"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Controlled: ${controlledValue} | Last commit: ${lastCommit} (${commitCount}) | Invalid: ${invalid ? "true" : "false"}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 370),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

        <TextField.Root
          invalid={invalid}
          onValueChange={setControlledValue}
          onValueCommit={(value) => {
            setLastCommit(value);
            setCommitCount((count) => count + 1);
          }}
          value={controlledValue}
        >
          <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(860, 98)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

            <TextField.Label asChild>
              <textbutton
                AutoButtonColor={false}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(860, 22)}
                Text="Controlled field"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </TextField.Label>

            <TextField.Input asChild>
              <textbox
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                PlaceholderText="Type at least 3 characters"
                Size={UDim2.fromOffset(860, 36)}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding PaddingLeft={new UDim(0, theme.space[10])} PaddingRight={new UDim(0, theme.space[10])} />
              </textbox>
            </TextField.Input>

            <TextField.Description asChild>
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(860, 16)}
                Text="onValueChange fires on text updates, onValueCommit fires on focus loss / Enter."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </TextField.Description>

            <TextField.Message asChild>
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(860, 16)}
                Text={invalid ? "Must be at least 3 characters." : "Looks good."}
                TextColor3={invalid ? theme.colors.danger : theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </TextField.Message>
          </frame>
        </TextField.Root>

        <TextField.Root defaultValue="uncontrolled value">
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(860, 82)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

            <TextField.Label asChild>
              <textbutton
                AutoButtonColor={false}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(860, 22)}
                Text="Uncontrolled field"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </TextField.Label>

            <TextField.Input asChild>
              <textbox
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                PlaceholderText="Uncontrolled text"
                Size={UDim2.fromOffset(860, 36)}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding PaddingLeft={new UDim(0, theme.space[10])} PaddingRight={new UDim(0, theme.space[10])} />
              </textbox>
            </TextField.Input>

            <TextField.Description asChild>
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(860, 16)}
                Text="This field keeps internal value state."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </TextField.Description>
          </frame>
        </TextField.Root>

        <TextField.Root defaultValue="disabled value" disabled>
          <frame BackgroundTransparency={1} LayoutOrder={3} Size={UDim2.fromOffset(860, 64)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

            <TextField.Label asChild>
              <textbutton
                AutoButtonColor={false}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(860, 22)}
                Text="Disabled field"
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </TextField.Label>

            <TextField.Input asChild>
              <textbox
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                PlaceholderText="Disabled"
                Size={UDim2.fromOffset(860, 36)}
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uipadding PaddingLeft={new UDim(0, theme.space[10])} PaddingRight={new UDim(0, theme.space[10])} />
              </textbox>
            </TextField.Input>
          </frame>
        </TextField.Root>
      </frame>

      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
          Position: UDim2.fromOffset(0, 464),
          Size: UDim2.fromOffset(180, 36),
          Text: "Reset Controlled",
          Event: {
            Activated: () => {
              setControlledValue("hello");
            },
          },
        }) as Record<string, unknown>)}
      />
    </frame>
  );
}
