import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import type { SurfaceToken } from "@lattice-ui/system";
import { Surface, useDensity } from "@lattice-ui/system";

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

type ToneMeta = {
  tone: SurfaceToken;
  title: string;
  detail: string;
  token: string;
};

const TONES: ReadonlyArray<ToneMeta> = [
  {
    tone: "surface",
    title: "Surface",
    detail: "Default system surface. Auto UICorner + UIStroke.",
    token: "colors.surface",
  },
  {
    tone: "elevated",
    title: "Elevated",
    detail: "Raised panels/menus. Auto UICorner + UIStroke.",
    token: "colors.surfaceElevated",
  },
  {
    tone: "sunken",
    title: "Sunken",
    detail: "Recessed wells/insets. Auto UICorner + UIStroke.",
    token: "colors.background",
  },
  {
    tone: "overlay",
    title: "Overlay",
    detail: "Scrims/dialog backdrops. No corner/stroke in M2.",
    token: "colors.overlay @ 0.35",
  },
];

function ToneCard(props: ToneMeta & { layoutOrder: number }) {
  const { theme } = useTheme();
  const onOverlay = props.tone === "overlay";
  const titleColor = onOverlay ? theme.colors.accentContrast : theme.colors.textPrimary;
  const detailColor = onOverlay ? theme.colors.accentContrast : theme.colors.textSecondary;

  return (
    <Surface LayoutOrder={props.layoutOrder} Size={UDim2.fromOffset(430, 150)} tone={props.tone}>
      <uipadding
        PaddingBottom={new UDim(0, theme.space[10])}
        PaddingLeft={new UDim(0, theme.space[12])}
        PaddingRight={new UDim(0, theme.space[12])}
        PaddingTop={new UDim(0, theme.space[10])}
      />
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(400, 22)}
        Text={`${props.title}  ·  tone="${props.tone}"`}
        TextColor3={titleColor}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(400, 34)}
        Text={props.detail}
        TextColor3={detailColor}
        TextSize={theme.typography.labelSm.textSize}
        TextWrapped={true}
        TextXAlignment={Enum.TextXAlignment.Left}
        TextYAlignment={Enum.TextYAlignment.Top}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={3}
        Size={UDim2.fromOffset(400, 18)}
        Text={`fill: ${props.token}`}
        TextColor3={detailColor}
        TextSize={theme.typography.labelSm.textSize - 1}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={4}
        Size={UDim2.fromOffset(400, 18)}
        Text={onOverlay ? "corner: none | stroke: none" : `corner: radius.lg=${theme.radius.lg} | stroke: border 1px`}
        TextColor3={detailColor}
        TextSize={theme.typography.labelSm.textSize - 1}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
    </Surface>
  );
}

export function SurfaceShowcaseScene() {
  const { theme } = useTheme();
  const { density } = useDensity();

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
          Text="Surface tokens: token-driven frame + auto UICorner/UIStroke (overlay excludes both)."
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.titleMd.textSize - 2}
          TextXAlignment={Enum.TextXAlignment.Left}
          truncate
        />
        <Text
          BackgroundTransparency={1}
          LayoutOrder={2}
          Size={UDim2.fromOffset(900, 20)}
          Text={`density: ${density} | space[10]=${theme.space[10]} | radius.lg=${theme.radius.lg} | border token drives UIStroke`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      <SectionHeader
        hint="All four surface tones side by side. Each renders as a themed frame with its own fill token."
        layoutOrder={2}
        title="TONES"
      />
      <frame
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        LayoutOrder={3}
        Size={UDim2.fromOffset(900, 0)}
      >
        <uigridlayout
          CellPadding={UDim2.fromOffset(theme.space[10], theme.space[10])}
          CellSize={UDim2.fromOffset(430, 150)}
          SortOrder={Enum.SortOrder.LayoutOrder}
        />
        {TONES.map((meta, index) => (
          <ToneCard
            key={`tone-${meta.tone}`}
            detail={meta.detail}
            layoutOrder={index + 1}
            title={meta.title}
            token={meta.token}
            tone={meta.tone}
          />
        ))}
      </frame>

      <SectionHeader
        hint="Sunken well > surface panel > elevated card. Elevation reads as brighter fills stepping forward."
        layoutOrder={4}
        title="NESTED ELEVATION"
      />
      <Surface LayoutOrder={5} Size={UDim2.fromOffset(900, 220)} tone="sunken">
        <uipadding
          PaddingBottom={new UDim(0, theme.space[16])}
          PaddingLeft={new UDim(0, theme.space[16])}
          PaddingRight={new UDim(0, theme.space[16])}
          PaddingTop={new UDim(0, theme.space[16])}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, -2)}
          Size={UDim2.fromOffset(400, 18)}
          Text="sunken"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Surface Position={UDim2.fromOffset(0, 22)} Size={UDim2.fromOffset(868, 160)} tone="surface">
          <uipadding
            PaddingBottom={new UDim(0, theme.space[14])}
            PaddingLeft={new UDim(0, theme.space[14])}
            PaddingRight={new UDim(0, theme.space[14])}
            PaddingTop={new UDim(0, theme.space[14])}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, -2)}
            Size={UDim2.fromOffset(400, 18)}
            Text="surface"
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Surface Position={UDim2.fromOffset(0, 22)} Size={UDim2.fromOffset(836, 96)} tone="elevated">
            <uipadding
              PaddingBottom={new UDim(0, theme.space[12])}
              PaddingLeft={new UDim(0, theme.space[12])}
              PaddingRight={new UDim(0, theme.space[12])}
              PaddingTop={new UDim(0, theme.space[12])}
            />
            <Text
              BackgroundTransparency={1}
              Size={UDim2.fromOffset(800, 20)}
              Text="elevated — top of the stack"
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 26)}
              Size={UDim2.fromOffset(800, 20)}
              Text="Each level keeps its own UIStroke; nesting does not compound corners."
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </Surface>
        </Surface>
      </Surface>

      <SectionHeader
        hint="Border/stroke comparison: decorated tones own a UIStroke from colors.border; overlay is strokeless."
        layoutOrder={6}
        title="BORDER / STROKE"
      />
      <frame
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        LayoutOrder={7}
        Size={UDim2.fromOffset(900, 0)}
      >
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[10])} />
        <Surface LayoutOrder={1} Size={UDim2.fromOffset(295, 96)} tone="surface">
          <uipadding
            PaddingBottom={new UDim(0, theme.space[10])}
            PaddingLeft={new UDim(0, theme.space[10])}
            PaddingRight={new UDim(0, theme.space[10])}
            PaddingTop={new UDim(0, theme.space[10])}
          />
          <Text
            BackgroundTransparency={1}
            Size={UDim2.fromOffset(270, 20)}
            Text="Decorated"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, 26)}
            Size={UDim2.fromOffset(270, 36)}
            Text="UIStroke from colors.border, 1px, radius.lg corner."
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextWrapped={true}
            TextXAlignment={Enum.TextXAlignment.Left}
            TextYAlignment={Enum.TextYAlignment.Top}
          />
        </Surface>
        <Surface LayoutOrder={2} Size={UDim2.fromOffset(295, 96)} tone="overlay">
          <uipadding
            PaddingBottom={new UDim(0, theme.space[10])}
            PaddingLeft={new UDim(0, theme.space[10])}
            PaddingRight={new UDim(0, theme.space[10])}
            PaddingTop={new UDim(0, theme.space[10])}
          />
          <Text
            BackgroundTransparency={1}
            Size={UDim2.fromOffset(270, 20)}
            Text="Overlay (strokeless)"
            TextColor3={theme.colors.accentContrast}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, 26)}
            Size={UDim2.fromOffset(270, 36)}
            Text="No corner, no stroke — a flat translucent scrim."
            TextColor3={theme.colors.accentContrast}
            TextSize={theme.typography.labelSm.textSize}
            TextWrapped={true}
            TextXAlignment={Enum.TextXAlignment.Left}
            TextYAlignment={Enum.TextYAlignment.Top}
          />
        </Surface>
        <frame
          BackgroundColor3={theme.colors.surface}
          BorderSizePixel={0}
          LayoutOrder={3}
          Size={UDim2.fromOffset(290, 96)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
          <uistroke Color={theme.colors.accent} Thickness={2} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[10])}
            PaddingLeft={new UDim(0, theme.space[10])}
            PaddingRight={new UDim(0, theme.space[10])}
            PaddingTop={new UDim(0, theme.space[10])}
          />
          <Text
            BackgroundTransparency={1}
            Size={UDim2.fromOffset(265, 20)}
            Text="Custom accent stroke"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, 26)}
            Size={UDim2.fromOffset(265, 36)}
            Text="Raw frame + UIStroke colors.accent, 2px, radius.md."
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextWrapped={true}
            TextXAlignment={Enum.TextXAlignment.Left}
            TextYAlignment={Enum.TextYAlignment.Top}
          />
        </frame>
      </frame>
    </frame>
  );
}
