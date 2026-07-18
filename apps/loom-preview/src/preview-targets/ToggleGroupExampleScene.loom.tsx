import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { ToggleGroup } from "@lattice-ui/toggle-group";
import { DocExampleShell } from "./DocExampleShell";

function ToggleGroupExample() {
  const { theme } = useTheme();
  const [formats, setFormats] = React.useState<Array<string>>(["bold"]);

  const items: Array<{ label: string; value: string }> = [
    { label: "B", value: "bold" },
    { label: "I", value: "italic" },
    { label: "U", value: "underline" },
  ];

  return (
    <ToggleGroup.Root onValueChange={setFormats} type="multiple" value={formats}>
      <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[4])} />
        {items.map((item) => {
          const pressed = formats.includes(item.value);
          return (
            <ToggleGroup.Item asChild key={item.value} value={item.value}>
              <textbutton
                AutoButtonColor={false}
                BackgroundColor3={pressed ? theme.colors.accent : theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(36, 32)}
                Text=""
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromScale(1, 1)}
                  Text={item.label}
                  TextColor3={pressed ? theme.colors.accentContrast : theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                />
              </textbutton>
            </ToggleGroup.Item>
          );
        })}
      </frame>
    </ToggleGroup.Root>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={32} width={116}>
      <ToggleGroupExample />
    </DocExampleShell>
  ),
  title: "ToggleGroup Example",
} as const;
