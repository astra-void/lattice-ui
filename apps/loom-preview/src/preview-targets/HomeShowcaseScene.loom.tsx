import { Avatar } from "@lattice-ui/react-avatar";
import { Dialog } from "@lattice-ui/react-dialog";
import { React } from "@lattice-ui/react-runtime";
import { Slider } from "@lattice-ui/react-slider";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { Switch } from "@lattice-ui/react-switch";
import { Toast, useToast } from "@lattice-ui/react-toast";
import { buttonRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

const members: Array<{ initials: string; accent?: boolean }> = [
  { initials: "AV", accent: true },
  { initials: "NP" },
  { initials: "+2" },
];

function PartyCard() {
  const { theme } = useTheme();
  const toast = useToast();
  const [openInvites, setOpenInvites] = React.useState(true);
  const [volume, setVolume] = React.useState(80);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromOffset(460, 260)}>
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uistroke Color={theme.colors.border} Thickness={1} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[16])}
          PaddingLeft={new UDim(0, theme.space[20])}
          PaddingRight={new UDim(0, theme.space[20])}
          PaddingTop={new UDim(0, theme.space[16])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

        <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(420, 44)}>
          <Text
            BackgroundTransparency={1}
            Font={Enum.Font.GothamBold}
            Position={UDim2.fromOffset(0, 2)}
            Size={UDim2.fromOffset(260, 18)}
            Text="Party"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, 24)}
            Size={UDim2.fromOffset(260, 16)}
            Text="3 of 8 members · voice connected"
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          {members.map((member, index) => (
            <Avatar.Root key={member.initials}>
              <frame
                BackgroundColor3={member.accent ? theme.colors.accent : theme.colors.surface}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(420 - (members.size() - index) * 38, 6)}
                Size={UDim2.fromOffset(32, 32)}
              >
                <uicorner CornerRadius={new UDim(1, 0)} />
                <uistroke Color={member.accent ? theme.colors.accent : theme.colors.border} Thickness={1} />
                <Avatar.Fallback asChild>
                  <textlabel
                    BackgroundTransparency={1}
                    BorderSizePixel={0}
                    Font={Enum.Font.GothamMedium}
                    Size={UDim2.fromScale(1, 1)}
                    Text={member.initials}
                    TextColor3={member.accent ? theme.colors.accentContrast : theme.colors.textSecondary}
                    TextSize={13}
                  />
                </Avatar.Fallback>
              </frame>
            </Avatar.Root>
          ))}
        </frame>

        <frame
          BackgroundColor3={theme.colors.border}
          BackgroundTransparency={0.5}
          BorderSizePixel={0}
          LayoutOrder={1}
          Size={UDim2.fromOffset(420, 1)}
        />

        <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(420, 40)}>
          <Text
            BackgroundTransparency={1}
            Font={Enum.Font.GothamMedium}
            Position={UDim2.fromOffset(0, 1)}
            Size={UDim2.fromOffset(320, 18)}
            Text="Open invites"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, 21)}
            Size={UDim2.fromOffset(320, 16)}
            Text="Friends can join without asking."
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          {/* The track color is entirely consumer-owned: the primitive only reports state. */}
          <Switch.Root asChild checked={openInvites} onCheckedChange={setOpenInvites}>
            <textbutton
              AnchorPoint={new Vector2(1, 0.5)}
              AutoButtonColor={false}
              BackgroundColor3={openInvites ? theme.colors.accent : theme.colors.surface}
              BorderSizePixel={0}
              Position={new UDim2(1, 0, 0.5, 0)}
              Size={UDim2.fromOffset(44, 24)}
              Text=""
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <uistroke Color={theme.colors.border} Thickness={1} Transparency={openInvites ? 1 : 0} />
              <Switch.Thumb asChild>
                <frame
                  BackgroundColor3={theme.colors.accentContrast}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(18, 18)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
              </Switch.Thumb>
            </textbutton>
          </Switch.Root>
        </frame>

        <frame BackgroundTransparency={1} LayoutOrder={3} Size={UDim2.fromOffset(420, 44)}>
          <Text
            BackgroundTransparency={1}
            Font={Enum.Font.GothamMedium}
            Size={UDim2.fromOffset(200, 18)}
            Text="Voice volume"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(370, 0)}
            Size={UDim2.fromOffset(50, 18)}
            Text={`${math.floor(volume)}%`}
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Right}
          />
          <Slider.Root max={100} min={0} onValueChange={setVolume} step={1} value={volume}>
            <Slider.Track asChild>
              <frame
                BackgroundColor3={theme.colors.surface}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(0, 30)}
                Size={UDim2.fromOffset(420, 6)}
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

        <frame
          BackgroundColor3={theme.colors.border}
          BackgroundTransparency={0.5}
          BorderSizePixel={0}
          LayoutOrder={4}
          Size={UDim2.fromOffset(420, 1)}
        />

        <frame BackgroundTransparency={1} LayoutOrder={5} Size={UDim2.fromOffset(420, 38)}>
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, 0)}
            Size={UDim2.fromOffset(200, 38)}
            Text="Party code · 7F2K"
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />

          <Dialog.Root onOpenChange={setInviteOpen} open={inviteOpen}>
            <Dialog.Trigger asChild>
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                  AnchorPoint: new Vector2(1, 0.5),
                  Position: new UDim2(1, 0, 0.5, 0),
                  Size: UDim2.fromOffset(130, 38),
                  Text: "Invite player",
                  TextSize: theme.typography.labelSm.textSize,
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              </textbutton>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay />
              <Dialog.Content>
                <frame
                  {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                    AnchorPoint: new Vector2(0.5, 0.5),
                    Position: UDim2.fromScale(0.5, 0.5),
                    Size: UDim2.fromOffset(380, 196),
                    ZIndex: 10,
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
                  <uistroke Color={theme.colors.border} Thickness={1} />
                  <uipadding
                    PaddingBottom={new UDim(0, theme.space[20])}
                    PaddingLeft={new UDim(0, theme.space[20])}
                    PaddingRight={new UDim(0, theme.space[20])}
                    PaddingTop={new UDim(0, theme.space[20])}
                  />
                  <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[14])} />

                  <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(340, 40)} ZIndex={11}>
                    <Text
                      BackgroundTransparency={1}
                      Font={Enum.Font.GothamBold}
                      Size={UDim2.fromOffset(340, 20)}
                      Text="Invite player"
                      TextColor3={theme.colors.textPrimary}
                      TextSize={theme.typography.bodyMd.textSize}
                      TextXAlignment={Enum.TextXAlignment.Left}
                      ZIndex={11}
                    />
                    <Text
                      BackgroundTransparency={1}
                      Position={UDim2.fromOffset(0, 24)}
                      Size={UDim2.fromOffset(340, 16)}
                      Text="They'll get a notification in game."
                      TextColor3={theme.colors.textSecondary}
                      TextSize={theme.typography.labelSm.textSize}
                      TextXAlignment={Enum.TextXAlignment.Left}
                      ZIndex={11}
                    />
                  </frame>

                  <frame
                    BackgroundColor3={theme.colors.surface}
                    BorderSizePixel={0}
                    LayoutOrder={1}
                    Size={UDim2.fromOffset(340, 40)}
                    ZIndex={11}
                  >
                    <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                    <uistroke Color={theme.colors.border} Thickness={1} />
                    <textbox
                      BackgroundTransparency={1}
                      BorderSizePixel={0}
                      ClearTextOnFocus={false}
                      PlaceholderColor3={theme.colors.textSecondary}
                      PlaceholderText="@username"
                      Size={UDim2.fromScale(1, 1)}
                      Text=""
                      TextColor3={theme.colors.textPrimary}
                      TextSize={theme.typography.labelSm.textSize}
                      TextXAlignment={Enum.TextXAlignment.Left}
                      ZIndex={12}
                    >
                      <uipadding
                        PaddingLeft={new UDim(0, theme.space[12])}
                        PaddingRight={new UDim(0, theme.space[12])}
                      />
                    </textbox>
                  </frame>

                  <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(340, 38)} ZIndex={11}>
                    <uilistlayout
                      FillDirection={Enum.FillDirection.Horizontal}
                      HorizontalAlignment={Enum.HorizontalAlignment.Right}
                      Padding={new UDim(0, theme.space[8])}
                    />
                    <Dialog.Close asChild>
                      <textbutton
                        {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                          LayoutOrder: 0,
                          Size: UDim2.fromOffset(90, 38),
                          Text: "Cancel",
                          TextSize: theme.typography.labelSm.textSize,
                          ZIndex: 11,
                        }) as Record<string, unknown>)}
                      >
                        <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                        <uistroke Color={theme.colors.border} Thickness={1} />
                      </textbutton>
                    </Dialog.Close>
                    <textbutton
                      {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                        Event: {
                          Activated: () => {
                            setInviteOpen(false);
                            toast.enqueue({
                              title: "Invite sent",
                              description: "Your friend will get a notification.",
                            });
                          },
                        },
                        LayoutOrder: 1,
                        Size: UDim2.fromOffset(120, 38),
                        Text: "Send invite",
                        TextSize: theme.typography.labelSm.textSize,
                        ZIndex: 11,
                      }) as Record<string, unknown>)}
                    >
                      <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                    </textbutton>
                  </frame>
                </frame>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </frame>
      </frame>

      <Toast.Viewport asChild>
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 272)} Size={UDim2.fromOffset(460, 66)}>
          <uilistlayout
            FillDirection={Enum.FillDirection.Vertical}
            HorizontalAlignment={Enum.HorizontalAlignment.Center}
            SortOrder={Enum.SortOrder.LayoutOrder}
          />
          {toast.visibleToasts.map((record) => (
            <Toast.Root
              asChild
              key={record.id}
              onExitComplete={() => toast.finalize(record.id)}
              visible={!record.exiting}
            >
              <canvasgroup
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(340, 62)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
                <uistroke Color={theme.colors.border} Thickness={1} />
                <frame
                  AnchorPoint={new Vector2(0, 0.5)}
                  BackgroundColor3={theme.colors.accent}
                  BorderSizePixel={0}
                  Position={new UDim2(0, 12, 0.5, 0)}
                  Size={UDim2.fromOffset(3, 34)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
                <Toast.Title asChild>
                  <Text
                    BackgroundTransparency={1}
                    Font={Enum.Font.GothamMedium}
                    Position={UDim2.fromOffset(28, 13)}
                    Size={UDim2.fromOffset(266, 18)}
                    Text={record.title ?? ""}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Toast.Title>
                <Toast.Description asChild>
                  <Text
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(28, 34)}
                    Size={UDim2.fromOffset(266, 16)}
                    Text={record.description ?? ""}
                    TextColor3={theme.colors.textSecondary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Toast.Description>
                <Toast.Close asChild onClose={() => toast.remove(record.id)}>
                  <textbutton
                    AutoButtonColor={false}
                    BackgroundTransparency={1}
                    BorderSizePixel={0}
                    Position={UDim2.fromOffset(306, 13)}
                    Size={UDim2.fromOffset(18, 18)}
                    Text="✕"
                    TextColor3={theme.colors.textSecondary}
                    TextSize={12}
                  />
                </Toast.Close>
              </canvasgroup>
            </Toast.Root>
          ))}
        </frame>
      </Toast.Viewport>
    </frame>
  );
}

function HomeShowcase() {
  return (
    <Toast.Provider defaultDurationMs={4000} maxVisible={1}>
      <PartyCard />
    </Toast.Provider>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={338} width={460}>
      <HomeShowcase />
    </DocExampleShell>
  ),
  title: "Home Showcase",
} as const;
