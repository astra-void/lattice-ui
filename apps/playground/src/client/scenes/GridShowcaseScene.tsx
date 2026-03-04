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
    <frame BackgroundColor3={theme.colors.accent} BorderSizePixel={0} LayoutOrder={props.order} Size={UDim2.fromOffset(10, 28)}>
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

export function GridShowcaseScene() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(900, 28)}
        Text="Grid showcase: columns or minColumnWidth driven two-dimensional layout"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Surface Position={UDim2.fromOffset(0, 54)} Size={UDim2.fromOffset(900, 420)} tone="surface">
        <Grid cellHeight={34} gap={8} minColumnWidth={120} padding={12} sx={{ Size: UDim2.fromScale(1, 1) }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((index) => (
            <Tile key={`grid-tile-${index}`} label={`Tile ${index}`} order={index} />
          ))}
        </Grid>
      </Surface>
    </frame>
  );
}
