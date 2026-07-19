import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { Grid, Surface } from "@lattice-ui/system";

type TileProps = {
  label: string;
  order: number;
};

function Tile(props: TileProps) {
  const { theme } = useTheme();
  return (
    <frame
      BackgroundColor3={theme.colors.accent}
      BorderSizePixel={0}
      LayoutOrder={props.order}
      Size={UDim2.fromOffset(10, 28)}
    >
      <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
      <Text
        AnchorPoint={new Vector2(0.5, 0.5)}
        BackgroundTransparency={1}
        Position={UDim2.fromScale(0.5, 0.5)}
        Size={UDim2.fromOffset(100, 20)}
        Text={props.label}
        TextColor3={theme.colors.accentContrast}
        TextSize={theme.typography.labelSm.textSize}
      />
    </frame>
  );
}

type CardProps = {
  title: string;
  body: string;
  order: number;
};

function Card(props: CardProps) {
  const { theme } = useTheme();
  return (
    <frame
      BackgroundColor3={theme.colors.surfaceElevated}
      BorderSizePixel={0}
      LayoutOrder={props.order}
      Size={UDim2.fromOffset(10, 10)}
    >
      <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[10])}
        PaddingLeft={new UDim(0, theme.space[12])}
        PaddingRight={new UDim(0, theme.space[12])}
        PaddingTop={new UDim(0, theme.space[10])}
      />
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(200, 20)}
        Text={props.title}
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(200, 40)}
        Text={props.body}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextWrapped={true}
        TextXAlignment={Enum.TextXAlignment.Left}
        TextYAlignment={Enum.TextYAlignment.Top}
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

const TILE_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CARDS: ReadonlyArray<{ title: string; body: string }> = [
  { title: "Overview", body: "Traffic up 12% week over week across all channels." },
  { title: "Revenue", body: "MRR reached the quarterly target three days early." },
  { title: "Latency", body: "p95 held under 180ms during the peak window." },
  { title: "Signups", body: "Trial conversions steady at 4.1% after the redesign." },
  { title: "Errors", body: "Error rate down to 0.3% after the retry rollout." },
  { title: "Storage", body: "Cold tier migration freed 2.4TB this cycle." },
];

export function GridShowcaseScene() {
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
          Text="Grid: columns (fixed) or minColumnWidth (responsive) driven two-dimensional layout."
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.titleMd.textSize - 2}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          LayoutOrder={2}
          Size={UDim2.fromOffset(900, 20)}
          Text={`Cell width is measured from container width; gap tokens: space[8]=${theme.space[8]}, space[16]=${theme.space[16]}`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      <SectionHeader
        hint="columns={4} — exactly four equal tracks regardless of width."
        layoutOrder={2}
        title="FIXED COLUMNS"
      />
      <Surface LayoutOrder={3} Size={UDim2.fromOffset(900, 128)} tone="surface">
        <Grid cellHeight={34} columns={4} gap={8} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
          {TILE_INDICES.map((index) => (
            <Tile key={`fixed-${index}`} label={`Tile ${index}`} order={index} />
          ))}
        </Grid>
      </Surface>

      <SectionHeader
        hint="minColumnWidth={120} — column count auto-fits to the available width (resize the panel to see reflow)."
        layoutOrder={4}
        title="RESPONSIVE (AUTO-FILL)"
      />
      <Surface LayoutOrder={5} Size={UDim2.fromOffset(900, 128)} tone="surface">
        <Grid cellHeight={34} gap={8} minColumnWidth={120} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
          {TILE_INDICES.map((index) => (
            <Tile key={`responsive-${index}`} label={`Tile ${index}`} order={index} />
          ))}
        </Grid>
      </Surface>

      <SectionHeader
        hint="Independent rowGap and columnGap on the same track count (columns={6})."
        layoutOrder={6}
        title="GAP VARIATIONS"
      />
      <frame
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        LayoutOrder={7}
        Size={UDim2.fromOffset(900, 0)}
      >
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[10])} />
        <Surface LayoutOrder={1} Size={UDim2.fromOffset(445, 120)} tone="elevated">
          <Grid cellHeight={30} columnGap={4} columns={6} padding={12} rowGap={4} sx={{ Size: UDim2.fromScale(1, 1) }}>
            {TILE_INDICES.map((index) => (
              <Tile key={`tight-${index}`} label={`${index}`} order={index} />
            ))}
          </Grid>
          <Text
            AnchorPoint={new Vector2(0, 1)}
            BackgroundTransparency={1}
            Position={new UDim2(0, theme.space[12], 1, -4)}
            Size={UDim2.fromOffset(400, 16)}
            Text="rowGap=4, columnGap=4 (tight)"
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize - 1}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </Surface>
        <Surface LayoutOrder={2} Size={UDim2.fromOffset(445, 120)} tone="elevated">
          <Grid
            cellHeight={30}
            columnGap={16}
            columns={6}
            padding={12}
            rowGap={16}
            sx={{ Size: UDim2.fromScale(1, 1) }}
          >
            {TILE_INDICES.map((index) => (
              <Tile key={`loose-${index}`} label={`${index}`} order={index} />
            ))}
          </Grid>
          <Text
            AnchorPoint={new Vector2(0, 1)}
            BackgroundTransparency={1}
            Position={new UDim2(0, theme.space[12], 1, -4)}
            Size={UDim2.fromOffset(400, 16)}
            Text="rowGap=16, columnGap=16 (loose)"
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize - 1}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </Surface>
      </frame>

      <SectionHeader
        hint="Realistic dashboard grid: responsive cards with title + body, minColumnWidth={260}."
        layoutOrder={8}
        title="CARD GRID"
      />
      <Surface LayoutOrder={9} Size={UDim2.fromOffset(900, 236)} tone="sunken">
        <Grid cellHeight={92} gap={12} minColumnWidth={260} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
          {CARDS.map((card, index) => (
            <Card key={`card-${index}`} body={card.body} order={index + 1} title={card.title} />
          ))}
        </Grid>
      </Surface>
    </frame>
  );
}
