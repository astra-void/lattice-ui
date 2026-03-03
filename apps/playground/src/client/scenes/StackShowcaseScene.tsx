import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { Row, Stack, Surface } from "@lattice-ui/system";

type DemoTileProps = {
  label: string;
  layoutOrder: number;
  width?: number;
};

function DemoTile(props: DemoTileProps) {
  const { theme } = useTheme();
  const width = props.width ?? 88;

  return (
    <frame
      BackgroundColor3={theme.colors.accent}
      BorderSizePixel={0}
      LayoutOrder={props.layoutOrder}
      Size={UDim2.fromOffset(width, 28)}
    >
      <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
      <Text
        AnchorPoint={new Vector2(0.5, 0.5)}
        BackgroundTransparency={1}
        Position={UDim2.fromScale(0.5, 0.5)}
        Size={UDim2.fromOffset(width - 8, 20)}
        Text={props.label}
        TextColor3={theme.colors.accentContrast}
        TextSize={theme.typography.labelSm.textSize}
      />
    </frame>
  );
}

export function StackShowcaseScene() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(900, 28)}
        Text="Stack/Row showcase: layout primitives generate UIListLayout + optional UIPadding."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(520, 24)}
        Text={`Density signal: theme.space[8] = ${theme.space[8]}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Stack gap={10} Position={UDim2.fromOffset(0, 70)} Size={UDim2.fromOffset(900, 430)}>
        <Surface LayoutOrder={1} Size={UDim2.fromOffset(900, 120)} tone="surface">
          <Stack gap={8} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={1}
              Size={UDim2.fromOffset(860, 20)}
              Text="Vertical Stack (token spacing): gap=8, padding=12"
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            <Row LayoutOrder={2} gap={8}>
              <DemoTile label="A" layoutOrder={1} />
              <DemoTile label="B" layoutOrder={2} />
              <DemoTile label="C" layoutOrder={3} />
            </Row>
          </Stack>
        </Surface>

        <Surface LayoutOrder={2} Size={UDim2.fromOffset(900, 120)} tone="elevated">
          <Stack gap={7} padding={10} paddingTop={4} paddingX={18} sx={{ Size: UDim2.fromScale(1, 1) }}>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={1}
              Size={UDim2.fromOffset(860, 20)}
              Text="Vertical Stack (numeric + precedence): padding=10, paddingX=18, paddingTop=4"
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            <Row LayoutOrder={2} gap={6}>
              <DemoTile label="1" layoutOrder={1} />
              <DemoTile label="2" layoutOrder={2} />
              <DemoTile label="3" layoutOrder={3} />
            </Row>
          </Stack>
        </Surface>

        <Surface LayoutOrder={3} Size={UDim2.fromOffset(900, 170)} tone="sunken">
          <Stack gap={8} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
            <Text
              BackgroundTransparency={1}
              LayoutOrder={1}
              Size={UDim2.fromOffset(860, 20)}
              Text='Row alignment + autoSize: (false), (true), ("xy")'
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />

            <Row
              LayoutOrder={2}
              align="center"
              autoSize={false}
              gap={6}
              justify="start"
              Size={UDim2.fromOffset(860, 32)}
            >
              <DemoTile label="start" layoutOrder={1} width={94} />
              <DemoTile label="center" layoutOrder={2} width={94} />
              <DemoTile label="end" layoutOrder={3} width={94} />
            </Row>

            <Row LayoutOrder={3} align="end" autoSize={true} gap={6} justify="center">
              <DemoTile label="auto:true" layoutOrder={1} width={106} />
              <DemoTile label="X or Y" layoutOrder={2} width={96} />
              <DemoTile label="by dir" layoutOrder={3} width={90} />
            </Row>

            <Row LayoutOrder={4} align="start" autoSize="xy" gap={6} justify="end">
              <DemoTile label='auto:"xy"' layoutOrder={1} width={106} />
              <DemoTile label="full auto" layoutOrder={2} width={98} />
              <DemoTile label="row" layoutOrder={3} width={82} />
            </Row>
          </Stack>
        </Surface>
      </Stack>
    </frame>
  );
}
