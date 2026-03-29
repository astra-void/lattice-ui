import { Accordion } from "@lattice-ui/accordion";
import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { playgroundAccordionTransition } from "../motion";
import { panelRecipe } from "../theme/recipes";

export function AccordionBasicScene() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Accordion: single/multiple disclosure"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 56),
          Size: UDim2.fromOffset(900, 320),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />

        <Accordion.Root collapsible type="multiple">
          <frame BackgroundTransparency={1} Size={UDim2.fromOffset(860, 280)}>
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

            {["General", "Privacy", "Notifications"].map((name) => (
              <Accordion.Item key={name} asChild value={string.lower(name)}>
                <frame BackgroundTransparency={1} Size={UDim2.fromOffset(860, 74)}>
                  <Accordion.Header asChild>
                    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(860, 32)}>
                      <Accordion.Trigger asChild>
                        <textbutton
                          BackgroundColor3={theme.colors.surfaceElevated}
                          BorderSizePixel={0}
                          Size={UDim2.fromOffset(860, 32)}
                          Text={name}
                          TextColor3={theme.colors.textPrimary}
                          TextSize={theme.typography.labelSm.textSize}
                          TextXAlignment={Enum.TextXAlignment.Left}
                        >
                          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                          <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                        </textbutton>
                      </Accordion.Trigger>
                    </frame>
                  </Accordion.Header>
                  <Accordion.Content asChild transition={playgroundAccordionTransition}>
                    <Text
                      BackgroundTransparency={1}
                      Position={UDim2.fromOffset(10, 40)}
                      Size={UDim2.fromOffset(840, 24)}
                      Text={`${name} content`}
                      TextColor3={theme.colors.textSecondary}
                      TextSize={theme.typography.bodyMd.textSize}
                      TextXAlignment={Enum.TextXAlignment.Left}
                    />
                  </Accordion.Content>
                </frame>
              </Accordion.Item>
            ))}
          </frame>
        </Accordion.Root>
      </frame>
    </frame>
  );
}
