import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import type { SpaceValue, StackAlign, StackJustify } from "@lattice-ui/system";
import { Row, Stack, Surface } from "@lattice-ui/system";

type DemoTileProps = {
  label: string;
  layoutOrder: number;
  width?: number;
  height?: number;
  tone?: "accent" | "danger";
};

function DemoTile(props: DemoTileProps) {
  const { theme } = useTheme();
  const width = props.width ?? 88;
  const height = props.height ?? 28;
  const fill = props.tone === "danger" ? theme.colors.danger : theme.colors.accent;
  const textColor = props.tone === "danger" ? theme.colors.dangerContrast : theme.colors.accentContrast;

  return (
    <frame
      BackgroundColor3={fill}
      BorderSizePixel={0}
      LayoutOrder={props.layoutOrder}
      Size={UDim2.fromOffset(width, height)}
    >
      <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
      <Text
        AnchorPoint={new Vector2(0.5, 0.5)}
        BackgroundTransparency={1}
        Position={UDim2.fromScale(0.5, 0.5)}
        Size={UDim2.fromOffset(width - 8, 20)}
        Text={props.label}
        TextColor3={textColor}
        TextSize={theme.typography.labelSm.textSize}
      />
    </frame>
  );
}

function SectionHeader(props: { title: string; hint: string; layoutOrder: number }) {
  const { theme } = useTheme();
  return (
    <frame
      AutomaticSize={Enum.AutomaticSize.Y}
      BackgroundTransparency={1}
      LayoutOrder={props.layoutOrder}
      Size={UDim2.fromOffset(900, 0)}
    >
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[2])} />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(900, 18)}
        Text={props.title}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(900, 18)}
        Text={props.hint}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize - 1}
        TextTransparency={0.25}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
    </frame>
  );
}

function PanelLabel(props: { text: string; layoutOrder?: number }) {
  const { theme } = useTheme();
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={props.layoutOrder ?? 1}
      Size={UDim2.fromOffset(860, 20)}
      Text={props.text}
      TextColor3={theme.colors.textPrimary}
      TextSize={theme.typography.bodyMd.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

const SPACING_ROWS: ReadonlyArray<SpaceValue> = [4, 8, 12, 16, 24];
const ALIGNMENTS: ReadonlyArray<StackAlign & StackJustify> = ["start", "center", "end"];

export function StackShowcaseScene() {
  const { theme } = useTheme();

  return (
    <frame AutomaticSize={Enum.AutomaticSize.Y} BackgroundTransparency={1} Size={UDim2.fromOffset(920, 0)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

      <frame
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(900, 0)}
      >
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
        <Text
          BackgroundTransparency={1}
          LayoutOrder={1}
          Size={UDim2.fromOffset(900, 28)}
          Text="Stack / Row: layout primitives generate UIListLayout + optional UIPadding."
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.titleMd.textSize - 2}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          LayoutOrder={2}
          Size={UDim2.fromOffset(900, 20)}
          Text={`Row = Stack with direction="horizontal" | density signal: space[8]=${theme.space[8]}, space[12]=${theme.space[12]}`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      <SectionHeader
        hint="Same three tiles laid out vertically vs horizontally from one primitive."
        layoutOrder={2}
        title="DIRECTION — VERTICAL vs HORIZONTAL"
      />
      <frame
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        LayoutOrder={3}
        Size={UDim2.fromOffset(900, 0)}
      >
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[10])} />
        <Surface LayoutOrder={1} Size={UDim2.fromOffset(295, 170)} tone="surface">
          <Stack gap={8} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
            <PanelLabel text="Stack (vertical, gap=8)" />
            <DemoTile label="A" layoutOrder={2} width={120} />
            <DemoTile label="B" layoutOrder={3} width={120} />
            <DemoTile label="C" layoutOrder={4} width={120} />
          </Stack>
        </Surface>
        <Surface LayoutOrder={2} Size={UDim2.fromOffset(595, 170)} tone="surface">
          <Stack gap={8} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
            <PanelLabel text="Row (horizontal, gap=8)" />
            <Row LayoutOrder={2} gap={8}>
              <DemoTile label="A" layoutOrder={1} />
              <DemoTile label="B" layoutOrder={2} />
              <DemoTile label="C" layoutOrder={3} />
            </Row>
            <PanelLabel layoutOrder={3} text="Nested: Row of vertical Stacks" />
            <Row LayoutOrder={4} gap={10}>
              <Stack gap={4}>
                <DemoTile label="x1" layoutOrder={1} width={70} height={22} />
                <DemoTile label="x2" layoutOrder={2} width={70} height={22} />
              </Stack>
              <Stack gap={4}>
                <DemoTile label="y1" layoutOrder={1} width={70} height={22} tone="danger" />
                <DemoTile label="y2" layoutOrder={2} width={70} height={22} tone="danger" />
              </Stack>
              <Stack gap={4}>
                <DemoTile label="z1" layoutOrder={1} width={70} height={22} />
                <DemoTile label="z2" layoutOrder={2} width={70} height={22} />
              </Stack>
            </Row>
          </Stack>
        </Surface>
      </frame>

      <SectionHeader
        hint="Identical tiles, gap stepped across the spacing scale so token differences are directly visible."
        layoutOrder={4}
        title="SPACING TOKENS COMPARED"
      />
      <Surface LayoutOrder={5} Size={UDim2.fromOffset(900, 210)} tone="elevated">
        <Stack gap={6} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
          {SPACING_ROWS.map((gapValue, index) => (
            <Row key={`gap-${gapValue}`} LayoutOrder={index + 1} align="center" gap={10}>
              <Text
                BackgroundTransparency={1}
                LayoutOrder={1}
                Size={UDim2.fromOffset(96, 24)}
                Text={`gap=${gapValue}`}
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Center}
              />
              <Row LayoutOrder={2} gap={gapValue}>
                <DemoTile label="1" layoutOrder={1} width={44} height={24} />
                <DemoTile label="2" layoutOrder={2} width={44} height={24} />
                <DemoTile label="3" layoutOrder={3} width={44} height={24} />
                <DemoTile label="4" layoutOrder={4} width={44} height={24} />
              </Row>
            </Row>
          ))}
        </Stack>
      </Surface>

      <SectionHeader
        hint="justify sets main-axis placement; align sets cross-axis. Track is fixed-width with autoSize={false}."
        layoutOrder={6}
        title="ALIGNMENT — justify (main) × align (cross)"
      />
      <Surface LayoutOrder={7} Size={UDim2.fromOffset(900, 190)} tone="surface">
        <Stack gap={8} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
          {ALIGNMENTS.map((justify, index) => (
            <Row
              key={`justify-${justify}`}
              LayoutOrder={index + 1}
              align="center"
              autoSize={false}
              gap={8}
              justify={justify}
              Size={UDim2.fromOffset(864, 34)}
              sx={{ BackgroundColor3: theme.colors.background, BackgroundTransparency: 0.4, BorderSizePixel: 0 }}
            >
              <DemoTile label={`justify="${justify}"`} layoutOrder={1} width={140} />
              <DemoTile label="tile" layoutOrder={2} width={80} />
            </Row>
          ))}
        </Stack>
      </Surface>

      <SectionHeader
        hint="autoSize collapses the frame to its content on the chosen axis (false / true / xy)."
        layoutOrder={8}
        title="AUTOSIZE EDGE CASES"
      />
      <Surface LayoutOrder={9} Size={UDim2.fromOffset(900, 150)} tone="sunken">
        <Stack gap={8} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
          <Row LayoutOrder={1} align="center" autoSize={false} gap={6} justify="start" Size={UDim2.fromOffset(864, 32)}>
            <DemoTile label="autoSize={false}" layoutOrder={1} width={150} />
            <DemoTile label="fixed track" layoutOrder={2} width={110} />
          </Row>
          <Row LayoutOrder={2} align="end" autoSize={true} gap={6} justify="center">
            <DemoTile label="autoSize={true}" layoutOrder={1} width={150} />
            <DemoTile label="grows on dir axis" layoutOrder={2} width={150} />
          </Row>
          <Row LayoutOrder={3} align="start" autoSize="xy" gap={6} justify="end">
            <DemoTile label={'autoSize="xy"'} layoutOrder={1} width={150} />
            <DemoTile label="hugs content" layoutOrder={2} width={120} />
          </Row>
        </Stack>
      </Surface>
    </frame>
  );
}
