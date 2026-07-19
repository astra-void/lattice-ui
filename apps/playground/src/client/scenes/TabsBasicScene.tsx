import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Tabs } from "@lattice-ui/tabs";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type DemoTabKey = "overview" | "activity" | "settings";
type ManualTabKey = "alpha" | "beta" | "gamma";

function PanelBody(props: { heading: string; lines: Array<string>; headingColor?: Color3 }) {
  const { theme } = useTheme();
  return (
    <React.Fragment>
      <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[10])}
        PaddingLeft={new UDim(0, theme.space[10])}
        PaddingRight={new UDim(0, theme.space[10])}
        PaddingTop={new UDim(0, theme.space[10])}
      />
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={1}
        Size={UDim2.fromOffset(600, 24)}
        Text={props.heading}
        TextColor3={props.headingColor ?? theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      {props.lines.map((line, index) => (
        <Text
          key={`${index}`}
          BackgroundTransparency={1}
          LayoutOrder={index + 2}
          Size={UDim2.fromOffset(600, 18)}
          Text={line}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      ))}
    </React.Fragment>
  );
}

export function TabsBasicScene() {
  const { theme } = useTheme();
  const [primaryValue, setPrimaryValue] = React.useState<DemoTabKey>("overview");
  const [secondaryValue, setSecondaryValue] = React.useState<ManualTabKey>("alpha");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 640)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(900, 28)}
        Text="Tabs: horizontal + vertical orientation, a disabled tab, forceMount content, and rich panels."
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

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 70)} Size={UDim2.fromOffset(900, 250)}>
        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(820, 20)}
          Text="Horizontal orientation (Settings tab is disabled)"
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
                Size: UDim2.fromOffset(640, 150),
              }) as Record<string, unknown>)}
            >
              <PanelBody
                heading="Overview"
                lines={["Status: healthy", "Active sessions: 128", "Uptime: 99.98% over 30 days"]}
              />
            </frame>
          </Tabs.Content>

          <Tabs.Content asChild value="activity">
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Position: UDim2.fromOffset(0, 82),
                Size: UDim2.fromOffset(640, 150),
              }) as Record<string, unknown>)}
            >
              <PanelBody
                heading="Activity"
                lines={["Deploy #4821 succeeded 5m ago", "3 pull requests merged today", "Alerts: none"]}
              />
            </frame>
          </Tabs.Content>

          <Tabs.Content asChild value="settings">
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Position: UDim2.fromOffset(0, 82),
                Size: UDim2.fromOffset(640, 150),
              }) as Record<string, unknown>)}
            >
              <PanelBody
                heading="Settings"
                headingColor={theme.colors.textSecondary}
                lines={["Disabled tabs remain unavailable until enabled."]}
              />
            </frame>
          </Tabs.Content>
        </Tabs.Root>
      </frame>

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 338)} Size={UDim2.fromOffset(900, 260)}>
        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(860, 20)}
          Text="Vertical orientation (Alpha uses forceMount, arrow keys move up/down)"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Tabs.Root
          defaultValue="alpha"
          onValueChange={(nextValue) => setSecondaryValue(nextValue as ManualTabKey)}
          orientation="vertical"
        >
          <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 26)} Size={UDim2.fromOffset(880, 200)}>
            <Tabs.List asChild>
              <frame BackgroundTransparency={1} Size={UDim2.fromOffset(180, 180)}>
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
                  Size: UDim2.fromOffset(660, 180),
                }) as Record<string, unknown>)}
              >
                <PanelBody
                  heading="Alpha (forceMount = true)"
                  lines={[
                    "This panel stays mounted even when another tab is active,",
                    "so its scroll position and inputs survive tab switches.",
                    "Region: us-east | Replicas: 3 | Queue depth: 12",
                  ]}
                />
              </frame>
            </Tabs.Content>

            <Tabs.Content asChild value="beta">
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                  Position: UDim2.fromOffset(196, 0),
                  Size: UDim2.fromOffset(660, 180),
                }) as Record<string, unknown>)}
              >
                <PanelBody
                  heading="Beta"
                  lines={["Mounted on demand when selected.", "Region: eu-west | Replicas: 2 | Queue depth: 4"]}
                />
              </frame>
            </Tabs.Content>

            <Tabs.Content asChild value="gamma">
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                  Position: UDim2.fromOffset(196, 0),
                  Size: UDim2.fromOffset(660, 180),
                }) as Record<string, unknown>)}
              >
                <PanelBody
                  heading="Gamma"
                  lines={["Mounted on demand when selected.", "Region: ap-south | Replicas: 1 | Queue depth: 0"]}
                />
              </frame>
            </Tabs.Content>
          </frame>
        </Tabs.Root>
      </frame>
    </frame>
  );
}
