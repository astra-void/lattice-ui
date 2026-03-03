import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { DensityProvider, useDensity } from "@lattice-ui/system";
import type { DensityToken } from "@lattice-ui/system";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

const densityOrder = ["compact", "comfortable", "spacious"] as const satisfies ReadonlyArray<DensityToken>;

function nextDensity(current: DensityToken): DensityToken {
  const currentIndex = densityOrder.indexOf(current);
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
  return densityOrder[(normalizedIndex + 1) % densityOrder.size()];
}

function DensityDetails(props: { title: string; description: string; layoutOrder: number }) {
  const { theme } = useTheme();
  const { density, setDensity } = useDensity();

  return (
    <frame
      {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
        LayoutOrder: props.layoutOrder,
        Size: UDim2.fromOffset(860, 150),
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
        <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
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
          Position={UDim2.fromOffset(0, 7)}
          Size={UDim2.fromOffset(520, 20)}
          Text={`space[8]=${theme.space[8]} | radius.md=${theme.radius.md} | bodyMd=${theme.typography.bodyMd.textSize}`}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>
    </frame>
  );
}

export function DensityScopeScene() {
  const { theme } = useTheme();
  const { density, setDensity } = useDensity();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(900, 28)}
        Text="Nested DensityProvider demo: inner subtree overrides density without compounding from parent."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(360, 24)}
        Text={`Root density: ${density}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
          Position: UDim2.fromOffset(370, 34),
          Size: UDim2.fromOffset(190, 32),
          Text: "Cycle Root Density",
          Event: {
            Activated: () => {
              setDensity(nextDensity(density));
            },
          },
        }) as Record<string, unknown>)}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 420),
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
