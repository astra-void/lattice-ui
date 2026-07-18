import { React } from "@lattice-ui/core";
import { Slider } from "@lattice-ui/slider";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function SliderExample() {
  const { theme } = useTheme();
  const [volume, setVolume] = React.useState(60);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(56, 28)}
        Text="Volume"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Slider.Root max={100} min={0} onValueChange={setVolume} step={1} value={volume}>
        <Slider.Track asChild>
          <frame
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(64, 10)}
            Size={UDim2.fromOffset(172, 8)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
            <Slider.Range asChild>
              <frame BackgroundColor3={theme.colors.accent} BorderSizePixel={0}>
                <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
              </frame>
            </Slider.Range>
            <Slider.Thumb asChild>
              <textbutton
                AutoButtonColor={false}
                BackgroundColor3={theme.colors.accentContrast}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(16, 16)}
                Text=""
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                <uistroke Color={theme.colors.border} Thickness={1} />
              </textbutton>
            </Slider.Thumb>
          </frame>
        </Slider.Track>
      </Slider.Root>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(248, 0)}
        Size={UDim2.fromOffset(32, 28)}
        Text={`${math.floor(volume)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Right}
      />
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={28} width={280}>
      <SliderExample />
    </DocExampleShell>
  ),
  title: "Slider Example",
} as const;
