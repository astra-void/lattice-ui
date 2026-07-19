import { React } from "@lattice-ui/core";
import { Slider } from "@lattice-ui/slider";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

const LEFT_X = 12;
const TRACK_W = 480;
const STEP_TICKS = [0, 25, 50, 75, 100];

function SectionLabel(props: { text: string; position: UDim2; width?: number }) {
  const { theme } = useTheme();
  return (
    <Text
      BackgroundTransparency={1}
      Position={props.position}
      Size={UDim2.fromOffset(props.width ?? 860, 20)}
      Text={props.text}
      TextColor3={theme.colors.textPrimary}
      TextSize={theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

function HSlider(props: {
  value: number;
  onValueChange: (value: number) => void;
  onCommit?: (value: number) => void;
  position: UDim2;
  width: number;
  min?: number;
  max?: number;
  step?: number;
  height?: number;
  showBadge?: boolean;
}) {
  const { theme } = useTheme();
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const height = props.height ?? 12;

  return (
    <Slider.Root
      max={max}
      min={min}
      onValueChange={props.onValueChange}
      onValueCommit={props.onCommit}
      step={props.step ?? 1}
      value={props.value}
    >
      <Slider.Track asChild>
        <frame
          BackgroundColor3={theme.colors.surfaceElevated}
          BorderSizePixel={0}
          Position={props.position}
          Size={UDim2.fromOffset(props.width, height)}
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
              Size={UDim2.fromOffset(20, 20)}
              Text=""
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
              {props.showBadge === true ? (
                <frame
                  AnchorPoint={new Vector2(0.5, 1)}
                  BackgroundColor3={theme.colors.accent}
                  BorderSizePixel={0}
                  Position={new UDim2(new UDim(0.5, 0), new UDim(0, -6))}
                  Size={UDim2.fromOffset(38, 20)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                  <Text
                    BackgroundTransparency={1}
                    Size={UDim2.fromScale(1, 1)}
                    Text={`${math.floor(props.value)}`}
                    TextColor3={theme.colors.accentContrast}
                    TextSize={theme.typography.labelSm.textSize}
                  />
                </frame>
              ) : undefined}
            </textbutton>
          </Slider.Thumb>
        </frame>
      </Slider.Track>
    </Slider.Root>
  );
}

export function SliderBasicScene() {
  const { theme } = useTheme();
  const [horizontalValue, setHorizontalValue] = React.useState(42);
  const [verticalValue, setVerticalValue] = React.useState(68);
  const [steppedValue, setSteppedValue] = React.useState(50);
  const [fineValue, setFineValue] = React.useState(50);
  const [coarseValue, setCoarseValue] = React.useState(50);
  const [lastCommit, setLastCommit] = React.useState("none");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Slider: pointer drag, stepped values, and commit feedback"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Horizontal: ${math.floor(horizontalValue)} (${math.floor(horizontalValue)}%) | Vertical: ${math.floor(verticalValue)} | Stepped: ${math.floor(steppedValue)} | Last commit: ${lastCommit}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 350),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />

        {/* Horizontal with live percentage + thumb value badge */}
        <SectionLabel
          position={UDim2.fromOffset(LEFT_X, 12)}
          text="Horizontal (drag) — value badge on thumb"
          width={480}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(LEFT_X + 400, 12)}
          Size={UDim2.fromOffset(80, 20)}
          Text={`${math.floor(horizontalValue)}%`}
          TextColor3={theme.colors.accent}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Right}
        />
        <HSlider
          onCommit={(value) => setLastCommit(`horizontal:${math.floor(value)}`)}
          onValueChange={setHorizontalValue}
          position={UDim2.fromOffset(LEFT_X, 46)}
          showBadge
          value={horizontalValue}
          width={TRACK_W}
        />

        {/* Stepped slider with visible tick marks + labels */}
        <SectionLabel
          position={UDim2.fromOffset(LEFT_X, 90)}
          text="Stepped (step 25) — snaps to tick marks"
          width={480}
        />
        <HSlider
          onCommit={(value) => setLastCommit(`stepped:${math.floor(value)}`)}
          onValueChange={setSteppedValue}
          position={UDim2.fromOffset(LEFT_X, 128)}
          step={25}
          value={steppedValue}
          width={TRACK_W}
        />
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(LEFT_X, 128)} Size={UDim2.fromOffset(TRACK_W, 12)}>
          {STEP_TICKS.map((tick) => (
            <frame
              key={`tick-${tick}`}
              AnchorPoint={new Vector2(0.5, 0)}
              BackgroundColor3={theme.colors.border}
              BorderSizePixel={0}
              Position={new UDim2(new UDim(tick / 100, 0), new UDim(0, -4))}
              Size={UDim2.fromOffset(2, 20)}
            />
          ))}
        </frame>
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(LEFT_X, 150)} Size={UDim2.fromOffset(TRACK_W, 16)}>
          {STEP_TICKS.map((tick) => (
            <Text
              key={`label-${tick}`}
              AnchorPoint={new Vector2(0.5, 0)}
              BackgroundTransparency={1}
              Position={new UDim2(new UDim(tick / 100, 0), new UDim(0, 0))}
              Size={UDim2.fromOffset(40, 16)}
              Text={`${tick}`}
              TextColor3={steppedValue === tick ? theme.colors.accent : theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
            />
          ))}
        </frame>

        {/* Fine vs coarse step comparison */}
        <SectionLabel position={UDim2.fromOffset(LEFT_X, 194)} text="Step granularity — fine vs coarse" width={480} />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(LEFT_X, 220)}
          Size={UDim2.fromOffset(480, 16)}
          Text={`fine · step 1 → ${math.floor(fineValue)}`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <HSlider
          height={8}
          onValueChange={setFineValue}
          position={UDim2.fromOffset(LEFT_X, 240)}
          step={1}
          value={fineValue}
          width={TRACK_W}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(LEFT_X, 262)}
          Size={UDim2.fromOffset(480, 16)}
          Text={`coarse · step 25 → ${math.floor(coarseValue)}`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <HSlider
          height={8}
          onValueChange={setCoarseValue}
          position={UDim2.fromOffset(LEFT_X, 282)}
          step={25}
          value={coarseValue}
          width={TRACK_W}
        />

        {/* Vertical (right column) */}
        <SectionLabel position={UDim2.fromOffset(560, 12)} text="Vertical (step 5)" width={320} />
        <Slider.Root
          max={100}
          min={0}
          onValueChange={setVerticalValue}
          onValueCommit={(value) => {
            setLastCommit(`vertical:${math.floor(value)}`);
          }}
          orientation="vertical"
          step={5}
          value={verticalValue}
        >
          <Slider.Track asChild>
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(572, 46)}
              Size={UDim2.fromOffset(12, 200)}
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
                  Size={UDim2.fromOffset(20, 20)}
                  Text=""
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </textbutton>
              </Slider.Thumb>
            </frame>
          </Slider.Track>
        </Slider.Root>

        {/* Disabled (right column) */}
        <SectionLabel position={UDim2.fromOffset(620, 12)} text="Disabled" width={260} />
        <Slider.Root defaultValue={30} disabled max={100} min={0}>
          <Slider.Track asChild>
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(620, 46)}
              Size={UDim2.fromOffset(260, 10)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.full)} />

              <Slider.Range asChild>
                <frame BackgroundColor3={theme.colors.textSecondary} BorderSizePixel={0}>
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </frame>
              </Slider.Range>

              <Slider.Thumb asChild>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={theme.colors.textSecondary}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(16, 16)}
                  Text=""
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                </textbutton>
              </Slider.Thumb>
            </frame>
          </Slider.Track>
        </Slider.Root>
      </frame>

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 440)} Size={UDim2.fromOffset(420, 40)}>
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
            Size: UDim2.fromOffset(120, 36),
            Text: "Set 0/100",
            Event: {
              Activated: () => {
                setHorizontalValue(0);
                setVerticalValue(100);
              },
            },
          }) as Record<string, unknown>)}
        />

        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
            Size: UDim2.fromOffset(120, 36),
            Text: "Set Mid",
            Event: {
              Activated: () => {
                setHorizontalValue(50);
                setVerticalValue(50);
              },
            },
          }) as Record<string, unknown>)}
        />
      </frame>
    </frame>
  );
}
