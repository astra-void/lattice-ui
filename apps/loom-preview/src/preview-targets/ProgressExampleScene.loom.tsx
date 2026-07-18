import { React } from "@lattice-ui/core";
import { Progress } from "@lattice-ui/progress";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function ProgressExample() {
  const { theme } = useTheme();
  const value = 66;

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
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
        Position={UDim2.fromOffset(24, 0)}
        Size={UDim2.fromOffset(176, 18)}
        Text="Uploading assets..."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(200, 0)}
        Size={UDim2.fromOffset(80, 18)}
        Text={`${value}%`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Right}
      />
      <Progress.Root max={100} value={value}>
        <frame
          BackgroundColor3={theme.colors.surfaceElevated}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(0, 28)}
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
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={36} width={280}>
      <ProgressExample />
    </DocExampleShell>
  ),
  title: "Progress Example",
} as const;
