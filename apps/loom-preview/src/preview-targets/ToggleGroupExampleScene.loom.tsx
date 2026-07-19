import { React } from "@lattice-ui/react-runtime";
import { Text, useTheme } from "@lattice-ui/react-style";
import { ToggleGroup } from "@lattice-ui/react-toggle-group";
import { DocExampleShell } from "./DocExampleShell";

function ToggleGroupExample() {
  const { theme } = useTheme();
  const [formats, setFormats] = React.useState<Array<string>>(["bold"]);
  const [heading, setHeading] = React.useState("h1");

  const formatItems: Array<{ label: string; value: string; font: Enum.Font }> = [
    { label: "B", value: "bold", font: Enum.Font.GothamBold },
    { label: "I", value: "italic", font: Enum.Font.Gotham },
    { label: "U", value: "underline", font: Enum.Font.Gotham },
  ];

  const headingItems: Array<{ label: string; value: string }> = [
    { label: "H1", value: "h1" },
    { label: "H2", value: "h2" },
  ];

  const renderItem = (label: string, font: Enum.Font, pressed: boolean, layoutOrder: number) => (
    <textbutton
      AutoButtonColor={false}
      BackgroundColor3={theme.colors.accent}
      BackgroundTransparency={pressed ? 0 : 1}
      BorderSizePixel={0}
      LayoutOrder={layoutOrder}
      Size={UDim2.fromOffset(34, 34)}
      Text=""
    >
      <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
      <Text
        BackgroundTransparency={1}
        Font={font}
        Size={UDim2.fromScale(1, 1)}
        Text={label}
        TextColor3={pressed ? theme.colors.accentContrast : theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
      />
    </textbutton>
  );

  return (
    <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
      <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[6])}
        PaddingLeft={new UDim(0, theme.space[6])}
        PaddingRight={new UDim(0, theme.space[6])}
        PaddingTop={new UDim(0, theme.space[6])}
      />
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        Padding={new UDim(0, theme.space[6])}
        VerticalAlignment={Enum.VerticalAlignment.Center}
      />

      <ToggleGroup.Root asChild onValueChange={setFormats} type="multiple" value={formats}>
        <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(106, 34)}>
          <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[2])} />
          {formatItems.map((item, index) => (
            <ToggleGroup.Item asChild key={item.value} value={item.value}>
              {renderItem(item.label, item.font, formats.includes(item.value), index)}
            </ToggleGroup.Item>
          ))}
        </frame>
      </ToggleGroup.Root>

      <frame
        BackgroundColor3={theme.colors.border}
        BorderSizePixel={0}
        LayoutOrder={1}
        Size={UDim2.fromOffset(1, 22)}
      />

      <ToggleGroup.Root
        asChild
        onValueChange={(nextValue) => setHeading(nextValue ?? "")}
        type="single"
        value={heading}
      >
        <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(70, 34)}>
          <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[2])} />
          {headingItems.map((item, index) => (
            <ToggleGroup.Item asChild key={item.value} value={item.value}>
              {renderItem(item.label, Enum.Font.GothamMedium, heading === item.value, index)}
            </ToggleGroup.Item>
          ))}
        </frame>
      </ToggleGroup.Root>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={46} width={202}>
      <ToggleGroupExample />
    </DocExampleShell>
  ),
  title: "ToggleGroup Example",
} as const;
