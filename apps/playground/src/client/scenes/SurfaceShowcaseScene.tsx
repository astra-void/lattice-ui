import { React } from "@lattice-ui/core";
import { Text, useTheme } from "@lattice-ui/style";
import { Surface, useDensity } from "@lattice-ui/system";
import type { SurfaceToken } from "@lattice-ui/system";

type ToneCardProps = {
  tone: SurfaceToken;
  title: string;
  detail: string;
  layoutOrder: number;
};

function ToneCard(props: ToneCardProps) {
  const { theme } = useTheme();
  const titleColor = props.tone === "overlay" ? theme.colors.accentContrast : theme.colors.textPrimary;
  const detailColor = props.tone === "overlay" ? theme.colors.accentContrast : theme.colors.textSecondary;

  return (
    <Surface LayoutOrder={props.layoutOrder} Size={UDim2.fromOffset(420, 170)} tone={props.tone}>
      <uipadding
        PaddingBottom={new UDim(0, theme.space[10])}
        PaddingLeft={new UDim(0, theme.space[12])}
        PaddingRight={new UDim(0, theme.space[12])}
        PaddingTop={new UDim(0, theme.space[10])}
      />
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(360, 24)}
        Text={`${props.title} (${props.tone})`}
        TextColor3={titleColor}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(380, 44)}
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
        Size={UDim2.fromOffset(380, 20)}
        Text={`space[8]=${theme.space[8]} | radius.lg=${theme.radius.lg}`}
        TextColor3={detailColor}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
    </Surface>
  );
}

export function SurfaceShowcaseScene() {
  const { theme } = useTheme();
  const { density } = useDensity();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(860, 28)}
        Text="Surface M2 showcase: token-driven frame + auto UICorner/UIStroke (overlay excludes both)."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(360, 24)}
        Text={`Active density: ${density}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 70)} Size={UDim2.fromOffset(900, 420)}>
        <uigridlayout
          CellPadding={UDim2.fromOffset(theme.space[10], theme.space[10])}
          CellSize={UDim2.fromOffset(430, 180)}
        />

        <ToneCard
          detail="Default system surface with corner + stroke."
          layoutOrder={1}
          title="Surface"
          tone="surface"
        />
        <ToneCard
          detail="Elevated tone uses surfaceElevated palette with corner + stroke."
          layoutOrder={2}
          title="Elevated"
          tone="elevated"
        />
        <ToneCard
          detail="Sunken tone uses background palette with corner + stroke."
          layoutOrder={3}
          title="Sunken"
          tone="sunken"
        />
        <ToneCard
          detail="Overlay intentionally has no UICorner/UIStroke in M2."
          layoutOrder={4}
          title="Overlay"
          tone="overlay"
        />
      </frame>
    </frame>
  );
}
