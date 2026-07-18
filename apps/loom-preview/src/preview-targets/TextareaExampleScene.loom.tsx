import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { Textarea } from "@lattice-ui/textarea";
import { DocExampleShell } from "./DocExampleShell";

function TextareaExample() {
  const { theme } = useTheme();

  return (
    <Textarea.Root>
      <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

        <Textarea.Label asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundTransparency={1}
            BorderSizePixel={0}
            LayoutOrder={1}
            Size={UDim2.fromOffset(300, 18)}
            Text="Your message"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </Textarea.Label>

        <Textarea.Input asChild>
          <textbox
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            LayoutOrder={2}
            PlaceholderText="Type your message here."
            Size={UDim2.fromOffset(300, 80)}
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextWrapped
            TextXAlignment={Enum.TextXAlignment.Left}
            TextYAlignment={Enum.TextYAlignment.Top}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
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
            LayoutOrder={3}
            Size={UDim2.fromOffset(300, 16)}
            Text="Your message will be sent to the support team."
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </Textarea.Description>
      </frame>
    </Textarea.Root>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={122} width={300}>
      <TextareaExample />
    </DocExampleShell>
  ),
  title: "Textarea Example",
} as const;
