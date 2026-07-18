import { React } from "@lattice-ui/core";
import { RadioGroup } from "@lattice-ui/radio-group";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function RadioGroupExample() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState("all");

  const options: Array<{ label: string; value: string }> = [
    { label: "All new messages", value: "all" },
    { label: "Direct messages and mentions", value: "mentions" },
    { label: "Nothing", value: "none" },
  ];

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(280, 20)}
        Text="Notify me about..."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <RadioGroup.Root onValueChange={setValue} value={value}>
        <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(280, 82)}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />
          {options.map((option) => (
            <RadioGroup.Item asChild key={option.value} value={option.value}>
              <textbutton AutoButtonColor={false} BackgroundTransparency={1} Size={UDim2.fromOffset(280, 22)} Text="">
                <frame
                  BackgroundColor3={theme.colors.surfaceElevated}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(0, 2)}
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
                  Position={UDim2.fromOffset(28, 0)}
                  Size={UDim2.fromOffset(252, 22)}
                  Text={option.label}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
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
    <DocExampleShell height={110} width={280}>
      <RadioGroupExample />
    </DocExampleShell>
  ),
  title: "RadioGroup Example",
} as const;
