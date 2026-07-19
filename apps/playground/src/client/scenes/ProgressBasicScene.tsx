import { React } from "@lattice-ui/core";
import { Progress } from "@lattice-ui/progress";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type Theme = ReturnType<typeof useTheme>["theme"];

const SUCCESS_COLOR = Color3.fromRGB(116, 176, 95);
const WARNING_COLOR = Color3.fromRGB(214, 173, 90);

function SectionHeader(props: { theme: Theme; text: string; order: number }) {
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={props.order}
      Size={UDim2.fromOffset(860, 18)}
      Text={props.text}
      TextColor3={props.theme.colors.textSecondary}
      TextSize={props.theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

function ProgressBar(props: {
  theme: Theme;
  order: number;
  label: string;
  value?: number;
  max?: number;
  indeterminate?: boolean;
  color?: Color3;
  width?: number;
}) {
  const { theme } = props;
  const width = props.width ?? 860;
  const max = props.max ?? 100;
  const color = props.color ?? theme.colors.accent;
  const percentText = props.indeterminate ? "…" : `${math.floor(((props.value ?? 0) / math.max(1, max)) * 100)}%`;

  return (
    <frame BackgroundTransparency={1} LayoutOrder={props.order} Size={UDim2.fromOffset(width, 40)}>
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

      <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(width, 18)}>
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 0)}
          Size={UDim2.fromOffset(width - 60, 18)}
          Text={props.label}
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          AnchorPoint={new Vector2(1, 0)}
          BackgroundTransparency={1}
          Position={new UDim2(1, 0, 0, 0)}
          Size={UDim2.fromOffset(60, 18)}
          Text={percentText}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Right}
        />
      </frame>

      <Progress.Root indeterminate={props.indeterminate} max={max} value={props.value}>
        <frame
          BackgroundColor3={theme.colors.surfaceElevated}
          BorderSizePixel={0}
          LayoutOrder={2}
          Size={UDim2.fromOffset(width, 14)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
          <Progress.Indicator asChild>
            <frame BackgroundColor3={color} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
              <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
            </frame>
          </Progress.Indicator>
        </frame>
      </Progress.Root>
    </frame>
  );
}

export function ProgressBasicScene() {
  const { theme } = useTheme();
  const [value, setValue] = React.useState(35);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 660)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Progress: determinate values, semantic states, indeterminate + spinner, interactive"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 22)}
        Text={`Interactive value: ${value}%`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 66)} Size={UDim2.fromOffset(940, 580)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[16])} />

        {/* Determinate */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 1,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <SectionHeader theme={theme} text="DETERMINATE" order={1} />
          <ProgressBar theme={theme} order={2} label="Empty" value={0} />
          <ProgressBar theme={theme} order={3} label="Quarter" value={25} />
          <ProgressBar theme={theme} order={4} label="Half" value={50} />
          <ProgressBar theme={theme} order={5} label="Almost done" value={85} />
          <ProgressBar theme={theme} order={6} label="Complete" value={100} />
        </frame>

        {/* Semantic states */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 2,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <SectionHeader theme={theme} text="SEMANTIC STATES" order={1} />
          <ProgressBar theme={theme} order={2} label="Success — upload complete" value={100} color={SUCCESS_COLOR} />
          <ProgressBar theme={theme} order={3} label="Warning — storage nearly full" value={78} color={WARNING_COLOR} />
          <ProgressBar theme={theme} order={4} label="Danger — quota exceeded" value={95} color={theme.colors.danger} />
        </frame>

        {/* Indeterminate + spinner */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 3,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <SectionHeader theme={theme} text="INDETERMINATE + SPINNER" order={1} />
          <ProgressBar theme={theme} order={2} label="Loading (indeterminate)" indeterminate />
          <Progress.Spinner asChild speedDegPerSecond={240} spinning>
            <frame BackgroundTransparency={1} BorderSizePixel={0} LayoutOrder={3} Size={UDim2.fromOffset(24, 24)}>
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
        </frame>

        {/* Interactive */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 4,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <SectionHeader theme={theme} text="INTERACTIVE" order={1} />
          <ProgressBar theme={theme} order={2} label="Adjustable value" value={value} />
          <frame BackgroundTransparency={1} LayoutOrder={3} Size={UDim2.fromOffset(300, 36)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />
            <textbutton
              {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                Text: "-10",
                Event: {
                  Activated: () => {
                    setValue((current) => math.max(0, current - 10));
                  },
                },
              }) as Record<string, unknown>)}
            />
            <textbutton
              {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                Text: "+10",
                Event: {
                  Activated: () => {
                    setValue((current) => math.min(100, current + 10));
                  },
                },
              }) as Record<string, unknown>)}
            />
          </frame>
        </frame>
      </frame>
    </frame>
  );
}
