import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Tabs } from "@lattice-ui/tabs";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type DemoTabKey = "overview" | "activity" | "settings";
type ManualTabKey = "alpha" | "beta" | "gamma";

export function TabsBasicScene() {
  const { theme } = useTheme();
  const [primaryValue, setPrimaryValue] = React.useState<DemoTabKey>("overview");
  const [secondaryValue, setSecondaryValue] = React.useState<ManualTabKey>("alpha");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(900, 28)}
        Text="Tabs basics: selected triggers, disabled states, custom layouts, and forceMount content."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(900, 22)}
        Text={`Primary: ${primaryValue} | Secondary: ${secondaryValue}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 70)} Size={UDim2.fromOffset(900, 220)}>
        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(820, 20)}
          Text="Primary Layout"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Tabs.Root onValueChange={(nextValue) => setPrimaryValue(nextValue as DemoTabKey)} value={primaryValue}>
          <Tabs.List asChild>
            <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 26)} Size={UDim2.fromOffset(640, 40)}>
              <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

              <Tabs.Trigger asChild value="overview">
                <textbutton
                  {...(mergeGuiProps(
                    buttonRecipe({ intent: primaryValue === "overview" ? "primary" : "surface", size: "sm" }, theme),
                    {
                      Text: "Overview",
                    },
                  ) as Record<string, unknown>)}
                />
              </Tabs.Trigger>

              <Tabs.Trigger asChild value="activity">
                <textbutton
                  {...(mergeGuiProps(
                    buttonRecipe({ intent: primaryValue === "activity" ? "primary" : "surface", size: "sm" }, theme),
                    {
                      Text: "Activity",
                    },
                  ) as Record<string, unknown>)}
                />
              </Tabs.Trigger>

              <Tabs.Trigger asChild disabled value="settings">
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                    Active: false,
                    Selectable: false,
                    Text: "Settings (Disabled)",
                    TextColor3: theme.colors.textSecondary,
                  }) as Record<string, unknown>)}
                />
              </Tabs.Trigger>
            </frame>
          </Tabs.List>

          <Tabs.Content asChild value="overview">
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Position: UDim2.fromOffset(0, 82),
                Size: UDim2.fromOffset(640, 110),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(theme.space[10], theme.space[10])}
                Size={UDim2.fromOffset(600, 26)}
                Text="Overview Content"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </frame>
          </Tabs.Content>

          <Tabs.Content asChild value="activity">
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Position: UDim2.fromOffset(0, 82),
                Size: UDim2.fromOffset(640, 110),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(theme.space[10], theme.space[10])}
                Size={UDim2.fromOffset(600, 26)}
                Text="Activity Content"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </frame>
          </Tabs.Content>

          <Tabs.Content asChild value="settings">
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Position: UDim2.fromOffset(0, 82),
                Size: UDim2.fromOffset(640, 110),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(theme.space[10], theme.space[10])}
                Size={UDim2.fromOffset(600, 26)}
                Text="Disabled tabs remain unavailable until enabled."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </frame>
          </Tabs.Content>
        </Tabs.Root>
      </frame>

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 308)} Size={UDim2.fromOffset(900, 240)}>
        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(860, 20)}
          Text="Secondary Layout"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Tabs.Root
          defaultValue="alpha"
          onValueChange={(nextValue) => setSecondaryValue(nextValue as ManualTabKey)}
          orientation="vertical"
        >
          <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 26)} Size={UDim2.fromOffset(880, 188)}>
            <Tabs.List asChild>
              <frame BackgroundTransparency={1} Size={UDim2.fromOffset(180, 168)}>
                <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

                <Tabs.Trigger asChild value="alpha">
                  <textbutton
                    {...(mergeGuiProps(
                      buttonRecipe({ intent: secondaryValue === "alpha" ? "primary" : "surface", size: "sm" }, theme),
                      {
                        Text: "Alpha",
                        Size: UDim2.fromOffset(170, 34),
                      },
                    ) as Record<string, unknown>)}
                  />
                </Tabs.Trigger>

                <Tabs.Trigger asChild value="beta">
                  <textbutton
                    {...(mergeGuiProps(
                      buttonRecipe({ intent: secondaryValue === "beta" ? "primary" : "surface", size: "sm" }, theme),
                      {
                        Text: "Beta",
                        Size: UDim2.fromOffset(170, 34),
                      },
                    ) as Record<string, unknown>)}
                  />
                </Tabs.Trigger>

                <Tabs.Trigger asChild value="gamma">
                  <textbutton
                    {...(mergeGuiProps(
                      buttonRecipe({ intent: secondaryValue === "gamma" ? "primary" : "surface", size: "sm" }, theme),
                      {
                        Text: "Gamma",
                        Size: UDim2.fromOffset(170, 34),
                      },
                    ) as Record<string, unknown>)}
                  />
                </Tabs.Trigger>
              </frame>
            </Tabs.List>

            <Tabs.Content asChild forceMount value="alpha">
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                  Position: UDim2.fromOffset(196, 0),
                  Size: UDim2.fromOffset(660, 168),
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(theme.space[10], theme.space[10])}
                  Size={UDim2.fromOffset(620, 30)}
                  Text="Alpha Content (forceMount=true, vertical navigation)"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </frame>
            </Tabs.Content>

            <Tabs.Content asChild value="beta">
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                  Position: UDim2.fromOffset(196, 0),
                  Size: UDim2.fromOffset(660, 168),
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(theme.space[10], theme.space[10])}
                  Size={UDim2.fromOffset(620, 30)}
                  Text="Beta Content"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </frame>
            </Tabs.Content>

            <Tabs.Content asChild value="gamma">
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                  Position: UDim2.fromOffset(196, 0),
                  Size: UDim2.fromOffset(660, 168),
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(theme.space[10], theme.space[10])}
                  Size={UDim2.fromOffset(620, 30)}
                  Text="Gamma Content"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </frame>
            </Tabs.Content>
          </frame>
        </Tabs.Root>
      </frame>
    </frame>
  );
}
