import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import type { DensityToken } from "@lattice-ui/system";
import { DensityProvider, useDensity } from "@lattice-ui/system";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

const densityOrder = ["compact", "comfortable", "spacious"] as const satisfies ReadonlyArray<DensityToken>;

function nextDensity(current: DensityToken): DensityToken {
  const currentIndex = densityOrder.indexOf(current);
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
  return densityOrder[(normalizedIndex + 1) % densityOrder.size()];
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

/**
 * The same cluster of controls, sized entirely from theme tokens. Because
 * useTheme() resolves the nearest DensityProvider's derived theme, the exact
 * same JSX renders tighter or looser depending on the density scope it sits in.
 */
function DensityCluster(props: { width: number }) {
  const { theme } = useTheme();

  return (
    <frame
      {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
        AutomaticSize: Enum.AutomaticSize.Y,
        Size: UDim2.fromOffset(props.width, 0),
      }) as Record<string, unknown>)}
    >
      <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[12])}
        PaddingLeft={new UDim(0, theme.space[12])}
        PaddingRight={new UDim(0, theme.space[12])}
        PaddingTop={new UDim(0, theme.space[12])}
      />
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(props.width - theme.space[12] * 2, theme.typography.bodyMd.textSize + 6)}
        Text="Controls"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
          LayoutOrder: 2,
          Size: new UDim2(1, 0, 0, theme.space[16] + theme.space[12]),
          Text: "Primary",
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
      </textbutton>

      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
          LayoutOrder: 3,
          Size: new UDim2(1, 0, 0, theme.space[16] + theme.space[12]),
          Text: "Surface",
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
      </textbutton>

      {/* Token swatch bars: height + gap are token-driven, so density is visible as size. */}
      <frame
        BackgroundTransparency={1}
        LayoutOrder={4}
        Size={UDim2.fromOffset(props.width - theme.space[12] * 2, theme.space[16])}
      >
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />
        <frame
          BackgroundColor3={theme.colors.accent}
          BorderSizePixel={0}
          LayoutOrder={1}
          Size={UDim2.fromOffset(theme.space[24], theme.space[16])}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
        </frame>
        <frame
          BackgroundColor3={theme.colors.accent}
          BorderSizePixel={0}
          LayoutOrder={2}
          Size={UDim2.fromOffset(theme.space[24], theme.space[16])}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
        </frame>
        <frame
          BackgroundColor3={theme.colors.accent}
          BorderSizePixel={0}
          LayoutOrder={3}
          Size={UDim2.fromOffset(theme.space[24], theme.space[16])}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
        </frame>
      </frame>

      <Text
        BackgroundTransparency={1}
        LayoutOrder={5}
        Size={UDim2.fromOffset(props.width - theme.space[12] * 2, theme.typography.labelSm.textSize + 4)}
        Text={`space[8]=${theme.space[8]} · space[16]=${theme.space[16]}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={6}
        Size={UDim2.fromOffset(props.width - theme.space[12] * 2, theme.typography.labelSm.textSize + 4)}
        Text={`radius.md=${theme.radius.md} · body=${theme.typography.bodyMd.textSize} · label=${theme.typography.labelSm.textSize}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
    </frame>
  );
}

function DensityColumn(props: { density: DensityToken; layoutOrder: number }) {
  const { theme } = useTheme();
  return (
    <frame
      AutomaticSize={Enum.AutomaticSize.Y}
      BackgroundTransparency={1}
      LayoutOrder={props.layoutOrder}
      Size={UDim2.fromOffset(286, 0)}
    >
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(286, 20)}
        Text={`density="${props.density}"`}
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <frame
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(286, 0)}
      >
        <DensityProvider defaultDensity={props.density}>
          <DensityCluster width={286} />
        </DensityProvider>
      </frame>
    </frame>
  );
}

function DensityDetails(props: { title: string; description: string; layoutOrder: number }) {
  const { theme } = useTheme();
  const { density, setDensity } = useDensity();

  return (
    <frame
      {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
        AutomaticSize: Enum.AutomaticSize.Y,
        LayoutOrder: props.layoutOrder,
        Size: UDim2.fromOffset(860, 0),
      }) as Record<string, unknown>)}
    >
      <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
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
        Size={UDim2.fromOffset(640, 22)}
        Text={`${props.title} density: ${density}`}
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={2}
        Size={UDim2.fromOffset(800, 42)}
        Text={props.description}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextWrapped={true}
        TextXAlignment={Enum.TextXAlignment.Left}
        TextYAlignment={Enum.TextYAlignment.Top}
      />
      <frame BackgroundTransparency={1} LayoutOrder={3} Size={UDim2.fromOffset(820, 32)}>
        <uilistlayout
          FillDirection={Enum.FillDirection.Horizontal}
          Padding={new UDim(0, theme.space[8])}
          VerticalAlignment={Enum.VerticalAlignment.Center}
        />
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
            LayoutOrder: 1,
            Size: UDim2.fromOffset(220, 32),
            Text: "Cycle Local Density",
            Event: {
              Activated: () => {
                setDensity(nextDensity(density));
              },
            },
          }) as Record<string, unknown>)}
        />
        <Text
          BackgroundTransparency={1}
          LayoutOrder={2}
          Size={UDim2.fromOffset(520, 20)}
          Text={`space[8]=${theme.space[8]} | radius.md=${theme.radius.md} | bodyMd=${theme.typography.bodyMd.textSize}`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
          TextYAlignment={Enum.TextYAlignment.Center}
        />
      </frame>
    </frame>
  );
}

export function DensityScopeScene() {
  const { theme } = useTheme();
  const { density, setDensity } = useDensity();

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
          Text="Density scopes: DensityProvider re-derives space/radius/typography from the base theme."
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.titleMd.textSize - 2}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(900, 34)}>
          <uilistlayout
            FillDirection={Enum.FillDirection.Horizontal}
            Padding={new UDim(0, theme.space[10])}
            VerticalAlignment={Enum.VerticalAlignment.Center}
          />
          <Text
            BackgroundTransparency={1}
            LayoutOrder={1}
            Size={UDim2.fromOffset(330, 24)}
            Text={`Root density: ${density}`}
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
            TextYAlignment={Enum.TextYAlignment.Center}
          />
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
              LayoutOrder: 2,
              Size: UDim2.fromOffset(190, 32),
              Text: "Cycle Root Density",
              Event: {
                Activated: () => {
                  setDensity(nextDensity(density));
                },
              },
            }) as Record<string, unknown>)}
          />
        </frame>
      </frame>

      <SectionHeader
        hint="One identical cluster rendered under three fixed density scopes — compare spacing, radius, and text size directly."
        layoutOrder={2}
        title="SIDE BY SIDE — compact / comfortable / spacious"
      />
      <frame
        AutomaticSize={Enum.AutomaticSize.Y}
        BackgroundTransparency={1}
        LayoutOrder={3}
        Size={UDim2.fromOffset(900, 0)}
      >
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[10])} />
        <DensityColumn density="compact" layoutOrder={1} />
        <DensityColumn density="comfortable" layoutOrder={2} />
        <DensityColumn density="spacious" layoutOrder={3} />
      </frame>

      <SectionHeader
        hint="Scoping: the outer panel follows the root toggle; the inner panel has its own provider and stays independent."
        layoutOrder={4}
        title="NESTED SCOPING"
      />
      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
          AutomaticSize: Enum.AutomaticSize.Y,
          LayoutOrder: 5,
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

        <DensityDetails
          description="This section follows root density. Use the root toggle above and confirm values update."
          layoutOrder={1}
          title="Outer"
        />

        <DensityProvider defaultDensity="compact">
          <DensityDetails
            description="This section has its own DensityProvider. Change inner density and verify outer values stay unchanged."
            layoutOrder={2}
            title="Inner (nested)"
          />
        </DensityProvider>
      </frame>
    </frame>
  );
}
