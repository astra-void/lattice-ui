import { Avatar } from "@lattice-ui/react-avatar";
import { Popover } from "@lattice-ui/react-popover";
import { React } from "@lattice-ui/react-runtime";
import type { Theme } from "@lattice-ui/react-style";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { Switch } from "@lattice-ui/react-switch";

import { menuItemRecipe, panelRecipe } from "../theme/recipes";

type MenuActionProps = {
  theme: Theme;
  label: string;
  hint: string;
  intent: "default" | "danger";
  layoutOrder: number;
  onSelect: () => void;
};

function MenuAction(props: MenuActionProps) {
  const { theme } = props;
  const danger = props.intent === "danger";

  return (
    <Popover.Close asChild>
      <textbutton
        {...(mergeGuiProps(menuItemRecipe({ intent: props.intent, disabled: "false" }, theme), {
          LayoutOrder: props.layoutOrder,
          Size: UDim2.fromOffset(256, 40),
          Text: "",
          Event: {
            Activated: props.onSelect,
          },
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
        <uipadding PaddingLeft={new UDim(0, theme.space[10])} PaddingRight={new UDim(0, theme.space[10])} />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 4)}
          Size={UDim2.fromOffset(236, 18)}
          Text={props.label}
          TextColor3={danger ? theme.colors.dangerContrast : theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 22)}
          Size={UDim2.fromOffset(236, 14)}
          Text={props.hint}
          TextColor3={danger ? theme.colors.dangerContrast : theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextTransparency={danger ? 0.2 : 0}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </textbutton>
    </Popover.Close>
  );
}

export function UserMenuScene() {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [online, setOnline] = React.useState(true);
  const [lastAction, setLastAction] = React.useState("none");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Account menu: Avatar trigger opens a Popover composed with a status Switch and menu actions"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`open=${open ? "true" : "false"} | status=${online ? "online" : "away"} | last action=${lastAction}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 72),
          Size: UDim2.fromOffset(900, 360),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.35} />
        <uipadding PaddingLeft={new UDim(0, theme.space[16])} PaddingTop={new UDim(0, theme.space[16])} />

        <Popover.Root onOpenChange={setOpen} open={open}>
          <Popover.Trigger asChild>
            <textbutton
              AutoButtonColor={false}
              BackgroundColor3={open ? theme.colors.surfaceElevated : theme.colors.surface}
              BorderSizePixel={0}
              Size={UDim2.fromOffset(220, 52)}
              Text=""
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.4} />
              <uipadding PaddingLeft={new UDim(0, theme.space[8])} />

              <Avatar.Root delayMs={200} src="rbxasset://textures/ui/GuiImagePlaceholder.png">
                <frame
                  AnchorPoint={new Vector2(0, 0.5)}
                  BackgroundColor3={theme.colors.accent}
                  BorderSizePixel={0}
                  Position={new UDim2(0, 8, 0.5, 0)}
                  Size={UDim2.fromOffset(36, 36)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                  <Avatar.Image asChild>
                    <imagelabel BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
                      <uicorner CornerRadius={new UDim(1, 0)} />
                    </imagelabel>
                  </Avatar.Image>
                  <Avatar.Fallback asChild>
                    <textlabel
                      BackgroundTransparency={1}
                      BorderSizePixel={0}
                      Size={UDim2.fromScale(1, 1)}
                      Text="AV"
                      TextColor3={theme.colors.accentContrast}
                      TextSize={theme.typography.labelSm.textSize}
                    />
                  </Avatar.Fallback>
                </frame>
              </Avatar.Root>

              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(56, 8)}
                Size={UDim2.fromOffset(150, 18)}
                Text="Astra Void"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(56, 28)}
                Size={UDim2.fromOffset(150, 16)}
                Text={online ? "● Online" : "○ Away"}
                TextColor3={online ? theme.colors.accent : theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </textbutton>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content asChild placement="bottom" sideOffset={8}>
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                  Size: UDim2.fromOffset(284, 268),
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
                <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.3} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[10])}
                  PaddingLeft={new UDim(0, theme.space[12])}
                  PaddingRight={new UDim(0, theme.space[12])}
                  PaddingTop={new UDim(0, theme.space[12])}
                />
                <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

                <Text
                  BackgroundTransparency={1}
                  LayoutOrder={0}
                  Size={UDim2.fromOffset(260, 18)}
                  Text="astra@lattice.dev"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />

                <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(260, 32)}>
                  <Text
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(0, 6)}
                    Size={UDim2.fromOffset(200, 20)}
                    Text="Show as online"
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.bodyMd.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                  <Switch.Root asChild checked={online} onCheckedChange={setOnline}>
                    <textbutton
                      AutoButtonColor={false}
                      BackgroundColor3={online ? theme.colors.accent : theme.colors.surfaceElevated}
                      BorderSizePixel={0}
                      Position={UDim2.fromOffset(214, 4)}
                      Size={UDim2.fromOffset(46, 24)}
                      Text=""
                    >
                      <uicorner CornerRadius={new UDim(1, 0)} />
                      <Switch.Thumb asChild>
                        <frame
                          BackgroundColor3={theme.colors.accentContrast}
                          BorderSizePixel={0}
                          Size={UDim2.fromOffset(20, 20)}
                        >
                          <uicorner CornerRadius={new UDim(1, 0)} />
                        </frame>
                      </Switch.Thumb>
                    </textbutton>
                  </Switch.Root>
                </frame>

                <frame
                  BackgroundColor3={theme.colors.border}
                  BorderSizePixel={0}
                  LayoutOrder={2}
                  Size={UDim2.fromOffset(260, 1)}
                />

                <MenuAction
                  theme={theme}
                  label="Profile"
                  hint="View and edit your details"
                  intent="default"
                  layoutOrder={3}
                  onSelect={() => {
                    setLastAction("profile");
                  }}
                />
                <MenuAction
                  theme={theme}
                  label="Preferences"
                  hint="Theme, density and shortcuts"
                  intent="default"
                  layoutOrder={4}
                  onSelect={() => {
                    setLastAction("preferences");
                  }}
                />
                <MenuAction
                  theme={theme}
                  label="Sign out"
                  hint="End this session"
                  intent="danger"
                  layoutOrder={5}
                  onSelect={() => {
                    setLastAction("sign-out");
                  }}
                />
              </frame>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </frame>
    </frame>
  );
}
