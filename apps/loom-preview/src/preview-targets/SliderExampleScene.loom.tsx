import { React } from "@lattice-ui/core";
import { Slider } from "@lattice-ui/slider";
import { Text, useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function SliderRow(props: { label: string; layoutOrder: number; value: number; onChange: (next: number) => void }) {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} LayoutOrder={props.layoutOrder} Size={UDim2.fromOffset(280, 44)}>
      <Text
        BackgroundTransparency={1}
        Font={Enum.Font.GothamMedium}
        Size={UDim2.fromOffset(200, 18)}
        Text={props.label}
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(230, 0)}
        Size={UDim2.fromOffset(50, 18)}
        Text={`${math.floor(props.value)}%`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Right}
      />
      <Slider.Root max={100} min={0} onValueChange={props.onChange} step={1} value={props.value}>
        <Slider.Track asChild>
          <frame
            BackgroundColor3={theme.colors.surface}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(0, 30)}
            Size={UDim2.fromOffset(280, 6)}
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
    </frame>
  );
}

function SliderExample() {
  const { theme } = useTheme();
  const [volume, setVolume] = React.useState(60);
  const [music, setMusic] = React.useState(35);

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
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

      <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(280, 40)}>
        <Text
          BackgroundTransparency={1}
          Font={Enum.Font.GothamBold}
          Size={UDim2.fromOffset(280, 18)}
          Text="Sound"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 22)}
          Size={UDim2.fromOffset(280, 16)}
          Text="Applies to this device only."
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      <SliderRow label="Master volume" layoutOrder={1} onChange={setVolume} value={volume} />
      <SliderRow label="Music" layoutOrder={2} onChange={setMusic} value={music} />
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={184} width={320}>
      <SliderExample />
    </DocExampleShell>
  ),
  title: "Slider Example",
} as const;
