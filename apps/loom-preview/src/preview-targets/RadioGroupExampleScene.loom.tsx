import { React } from "@lattice-ui/core";
import { RadioGroup } from "@lattice-ui/radio-group";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function RadioGroupExample() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState("mentions");

  const options: Array<{ label: string; description: string; value: string }> = [
    { label: "Everything", description: "All new messages and threads.", value: "all" },
    { label: "Mentions only", description: "Direct messages and @mentions.", value: "mentions" },
    { label: "Muted", description: "Nothing — check in when you want.", value: "none" },
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
          Text="Notifications"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 22)}
          Size={UDim2.fromOffset(280, 16)}
          Text="Notify me about…"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      <RadioGroup.Root onValueChange={setValue} value={value}>
        <frame
          AutomaticSize={Enum.AutomaticSize.Y}
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(280, 0)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />
          {options.map((option, index) => (
            <RadioGroup.Item asChild key={option.value} value={option.value}>
              <textbutton
                AutoButtonColor={false}
                BackgroundTransparency={1}
                LayoutOrder={index}
                Size={UDim2.fromOffset(280, 40)}
                Text=""
              >
                <frame
                  BackgroundColor3={theme.colors.surfaceElevated}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(0, 3)}
                  Size={UDim2.fromOffset(18, 18)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                  <uistroke Color={value === option.value ? theme.colors.accent : theme.colors.border} Thickness={1} />
                  {value === option.value ? (
                    <frame
                      AnchorPoint={new Vector2(0.5, 0.5)}
                      BackgroundColor3={theme.colors.accent}
                      BorderSizePixel={0}
                      Position={UDim2.fromScale(0.5, 0.5)}
                      Size={UDim2.fromOffset(8, 8)}
                    >
                      <uicorner CornerRadius={new UDim(1, 0)} />
                    </frame>
                  ) : undefined}
                </frame>
                <Text
                  BackgroundTransparency={1}
                  Font={Enum.Font.GothamMedium}
                  Position={UDim2.fromOffset(30, 2)}
                  Size={UDim2.fromOffset(250, 18)}
                  Text={option.label}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(30, 22)}
                  Size={UDim2.fromOffset(250, 16)}
                  Text={option.description}
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </textbutton>
            </RadioGroup.Item>
          ))}
        </frame>
      </RadioGroup.Root>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={222} width={320}>
      <RadioGroupExample />
    </DocExampleShell>
  ),
  title: "RadioGroup Example",
} as const;
