import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { Menu } from "@lattice-ui/menu";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

function renderMenuTree(playerGui: PlayerGui, defaultOpen = true, disableAlpha = false) {
  return (
    <PortalProvider container={playerGui}>
      <Menu.Root defaultOpen={defaultOpen}>
        <Menu.Trigger asChild>
          <textbutton Selectable={true} Text="menu-trigger" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Content asChild>
            <frame>
              <Menu.Item asChild disabled={disableAlpha}>
                <textbutton Selectable={true} Text="menu-item-alpha" />
              </Menu.Item>
              <Menu.Item asChild>
                <textbutton Selectable={true} Text="menu-item-beta" />
              </Menu.Item>
              <textlabel Text="menu-marker" />
            </frame>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
    </PortalProvider>
  );
}

function ControlledMenuSelectionHarness(props: { commitSelection: boolean; playerGui: PlayerGui }) {
  const [open, setOpen] = React.useState(true);
  const committedRef = React.useRef(false);

  React.useEffect(() => {
    if (!props.commitSelection || committedRef.current) {
      return;
    }

    committedRef.current = true;
    setOpen(false);
  }, [props.commitSelection]);

  return (
    <PortalProvider container={props.playerGui}>
      <Menu.Root onOpenChange={setOpen} open={open}>
        <Menu.Trigger asChild>
          <textbutton Selectable={true} Text="menu-trigger-controlled" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Content asChild forceMount>
            <frame>
              <Menu.Item asChild>
                <textbutton Selectable={true} Text="menu-item-alpha-controlled" />
              </Menu.Item>
              <Menu.Item asChild>
                <textbutton Selectable={true} Text="menu-item-beta-controlled" />
              </Menu.Item>
              <textlabel Text="menu-marker-controlled" />
            </frame>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
    </PortalProvider>
  );
}

export = () => {
  describe("menu", () => {
    it("keeps forced content mounted while toggling visibility with open state", () => {
      withReactHarness("MenuForceMountVisibility", (harness) => {
        const renderTree = (open: boolean) => (
          <PortalProvider container={harness.playerGui}>
            <Menu.Root open={open}>
              <Menu.Trigger asChild>
                <textbutton Selectable={true} Text="menu-trigger-force" />
              </Menu.Trigger>

              <Menu.Portal>
                <Menu.Content asChild forceMount>
                  <frame>
                    <textlabel Text="menu-marker-force" />
                  </frame>
                </Menu.Content>
              </Menu.Portal>
            </Menu.Root>
          </PortalProvider>
        );

        harness.render(renderTree(false));
        waitForEffects(3);

        const hiddenMarker = findTextLabelByText(harness.playerGui, "menu-marker-force");
        assert(hiddenMarker !== undefined, "Forced menu content should stay mounted while closed.");
        const hiddenHost = hiddenMarker.Parent;
        assert(hiddenHost?.IsA("GuiObject"), "Forced menu marker parent should be a GuiObject.");
        assert(hiddenHost.Visible === false, "Forced menu content should be hidden while closed.");

        harness.render(renderTree(true));
        waitForEffects(4);

        const visibleMarker = findTextLabelByText(harness.playerGui, "menu-marker-force");
        assert(visibleMarker !== undefined, "Forced menu content should remain mounted when opened.");
        const visibleHost = visibleMarker.Parent;
        assert(visibleHost?.IsA("GuiObject"), "Opened forced menu marker parent should be a GuiObject.");
        assert(visibleHost.Visible === true, "Forced menu content should become visible when opened.");
      });
    });

    it("moves selection to the first enabled item when opened", () => {
      withReactHarness("MenuOpenFocus", (harness) => {
        harness.render(renderMenuTree(harness.playerGui, true, true));

        waitForEffects(4);
        const betaItem = findTextButtonByText(harness.playerGui, "menu-item-beta");
        assert(betaItem !== undefined, "First enabled menu item should mount.");
        assert(
          GuiService.SelectedObject === betaItem,
          "Opening MenuContent should move selection to the first enabled item.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("restores trigger focus after selecting a menu item", () => {
      withReactHarness("MenuRestoreTriggerFocus", (harness) => {
        const renderTree = (commitSelection: boolean) => (
          <ControlledMenuSelectionHarness commitSelection={commitSelection} playerGui={harness.playerGui} />
        );

        harness.render(renderTree(false));

        waitForEffects(4);
        const trigger = findTextButtonByText(harness.container, "menu-trigger-controlled");
        assert(trigger !== undefined, "Menu trigger should mount.");

        harness.render(renderTree(true));
        waitForEffects(4);

        const markerAfterClose = findTextLabelByText(harness.playerGui, "menu-marker-controlled");
        const markerParentAfterClose = markerAfterClose?.Parent;
        assert(
          markerParentAfterClose?.IsA("GuiObject") && markerParentAfterClose.Visible === false,
          "Forced menu content should be hidden after selection closes it.",
        );
        assert(
          GuiService.SelectedObject === trigger,
          "Selecting a menu item should restore trigger focus when the menu closes.",
        );

        GuiService.SelectedObject = undefined;
      });
    });
  });
};
