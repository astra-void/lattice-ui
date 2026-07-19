import { Progress } from "@lattice-ui/react-progress";
import { React } from "@lattice-ui/react-runtime";
import { Text, useTheme } from "@lattice-ui/react-style";
import { DocExampleShell } from "./DocExampleShell";

function ProgressExample() {
  const { theme } = useTheme();
  const value = 66;

  return (
    <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
      <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[16])}
        PaddingLeft={new UDim(0, theme.space[20])}
        PaddingRight={new UDim(0, theme.space[20])}
        PaddingTop={new UDim(0, theme.space[16])}
      />

      <Progress.Spinner asChild speedDegPerSecond={240} spinning>
        <frame
          BackgroundTransparency={1}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(0, 1)}
          Size={UDim2.fromOffset(16, 16)}
        >
          <uicorner CornerRadius={new UDim(1, 0)} />
          <uistroke Color={theme.colors.accent} Thickness={2} Transparency={0.35} />
          <frame
            AnchorPoint={new Vector2(0.5, 0.5)}
            BackgroundColor3={theme.colors.accent}
            BorderSizePixel={0}
            Position={UDim2.fromScale(0.5, 0.1)}
            Size={UDim2.fromOffset(4, 4)}
          >
            <uicorner CornerRadius={new UDim(1, 0)} />
          </frame>
        </frame>
      </Progress.Spinner>

      <Text
        BackgroundTransparency={1}
        Font={Enum.Font.GothamMedium}
        Position={UDim2.fromOffset(26, 0)}
        Size={UDim2.fromOffset(200, 18)}
        Text="Syncing library…"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(230, 0)}
        Size={UDim2.fromOffset(50, 18)}
        Text={`${value}%`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Right}
      />

      <Progress.Root max={100} value={value}>
        <frame
          BackgroundColor3={theme.colors.surface}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(0, 30)}
          Size={UDim2.fromOffset(280, 8)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
          <Progress.Indicator asChild>
            <frame BackgroundColor3={theme.colors.accent} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
              <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
            </frame>
          </Progress.Indicator>
        </frame>
      </Progress.Root>

      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 48)}
        Size={UDim2.fromOffset(280, 16)}
        Text="128 of 194 items · about 2 min left"
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={96} width={320}>
      <ProgressExample />
    </DocExampleShell>
  ),
  title: "Progress Example",
} as const;
