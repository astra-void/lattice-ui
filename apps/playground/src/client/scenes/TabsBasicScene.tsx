import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lattice-ui/tabs";
import { buttonRecipe, panelRecipe } from "../theme/recipes";

type DemoTabKey = "overview" | "activity" | "settings";
type ManualTabKey = "alpha" | "beta" | "gamma";

export function TabsBasicScene() {
  const { theme } = useTheme();
  const [autoValue, setAutoValue] = React.useState<DemoTabKey>("overview");
  const [manualValue, setManualValue] = React.useState<ManualTabKey>("alpha");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(900, 28)}
        Text="Tabs MVP: automatic/manual activation, orientation keymap, disabled skip, forceMount."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(900, 22)}
        Text={`Automatic: ${autoValue} | Manual: ${manualValue}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 70)} Size={UDim2.fromOffset(900, 220)}>
        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(820, 20)}
          Text="Automatic / Horizontal (Left/Right focus move + activation)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Tabs
          onValueChange={(nextValue) => setAutoValue(nextValue as DemoTabKey)}
          orientation="horizontal"
          value={autoValue}
        >
          <TabsList asChild>
            <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 26)} Size={UDim2.fromOffset(640, 40)}>
              <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />

              <TabsTrigger asChild value="overview">
                <textbutton
                  {...(mergeGuiProps(
                    buttonRecipe({ intent: autoValue === "overview" ? "primary" : "surface", size: "sm" }, theme),
                    {
                      Text: "Overview",
                    },
                  ) as Record<string, unknown>)}
                />
              </TabsTrigger>

              <TabsTrigger asChild value="activity">
                <textbutton
                  {...(mergeGuiProps(
                    buttonRecipe({ intent: autoValue === "activity" ? "primary" : "surface", size: "sm" }, theme),
                    {
                      Text: "Activity",
                    },
                  ) as Record<string, unknown>)}
                />
              </TabsTrigger>

              <TabsTrigger asChild disabled value="settings">
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                    Active: false,
                    Selectable: false,
                    Text: "Settings (Disabled)",
                    TextColor3: theme.colors.textSecondary,
                  }) as Record<string, unknown>)}
                />
              </TabsTrigger>
            </frame>
          </TabsList>

          <TabsContent asChild value="overview">
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
          </TabsContent>

          <TabsContent asChild value="activity">
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
          </TabsContent>

          <TabsContent asChild value="settings">
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
                Text="Disabled tab content should not be selected by navigation."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </frame>
          </TabsContent>
        </Tabs>
      </frame>

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 308)} Size={UDim2.fromOffset(900, 240)}>
        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(860, 20)}
          Text="Manual / Vertical (Up/Down focus move, Enter/Space/Activated to activate)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Tabs
          activationMode="manual"
          defaultValue="alpha"
          onValueChange={(nextValue) => setManualValue(nextValue as ManualTabKey)}
          orientation="vertical"
        >
          <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 26)} Size={UDim2.fromOffset(880, 188)}>
            <TabsList asChild>
              <frame BackgroundTransparency={1} Size={UDim2.fromOffset(180, 168)}>
                <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

                <TabsTrigger asChild value="alpha">
                  <textbutton
                    {...(mergeGuiProps(
                      buttonRecipe({ intent: manualValue === "alpha" ? "primary" : "surface", size: "sm" }, theme),
                      {
                        Text: "Alpha",
                        Size: UDim2.fromOffset(170, 34),
                      },
                    ) as Record<string, unknown>)}
                  />
                </TabsTrigger>

                <TabsTrigger asChild value="beta">
                  <textbutton
                    {...(mergeGuiProps(
                      buttonRecipe({ intent: manualValue === "beta" ? "primary" : "surface", size: "sm" }, theme),
                      {
                        Text: "Beta",
                        Size: UDim2.fromOffset(170, 34),
                      },
                    ) as Record<string, unknown>)}
                  />
                </TabsTrigger>

                <TabsTrigger asChild value="gamma">
                  <textbutton
                    {...(mergeGuiProps(
                      buttonRecipe({ intent: manualValue === "gamma" ? "primary" : "surface", size: "sm" }, theme),
                      {
                        Text: "Gamma",
                        Size: UDim2.fromOffset(170, 34),
                      },
                    ) as Record<string, unknown>)}
                  />
                </TabsTrigger>
              </frame>
            </TabsList>

            <TabsContent asChild forceMount value="alpha">
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
                  Text="Alpha Content (forceMount=true)"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </frame>
            </TabsContent>

            <TabsContent asChild value="beta">
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
            </TabsContent>

            <TabsContent asChild value="gamma">
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
            </TabsContent>
          </frame>
        </Tabs>
      </frame>
    </frame>
  );
}
