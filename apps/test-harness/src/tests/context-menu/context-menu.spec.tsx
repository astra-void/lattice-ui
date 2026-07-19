import { ContextMenu } from "@lattice-ui/react-context-menu";
import { PortalProvider } from "@lattice-ui/react-layer";
import { React } from "@lattice-ui/react-runtime";
import { findTextButtonByText, findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

function renderContextMenuTree(playerGui: PlayerGui, defaultOpen = true) {
  return (
    <PortalProvider container={playerGui}>
      <ContextMenu.Root defaultOpen={defaultOpen}>
        <ContextMenu.Trigger asChild>
          <textbutton Text="context-menu-trigger" />
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content asChild>
            <frame>
              <ContextMenu.Item asChild>
                <textbutton Text="context-menu-item-alpha" />
              </ContextMenu.Item>
              <ContextMenu.Item asChild>
                <textbutton Text="context-menu-item-beta" />
              </ContextMenu.Item>
              <textlabel Text="context-menu-marker" />
            </frame>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </PortalProvider>
  );
}

export = () => {
  describe("context-menu", () => {
    it("keeps forced content mounted while toggling visibility with open state", () => {
      withReactHarness("ContextMenuForceMountVisibility", (harness) => {
        const renderTree = (open: boolean) => (
          <PortalProvider container={harness.playerGui}>
            <ContextMenu.Root open={open}>
              <ContextMenu.Trigger asChild>
                <textbutton Text="context-menu-trigger-force" />
              </ContextMenu.Trigger>

              <ContextMenu.Portal>
                <ContextMenu.Content asChild forceMount>
                  <frame>
                    <textlabel Text="context-menu-marker-force" />
                  </frame>
                </ContextMenu.Content>
              </ContextMenu.Portal>
            </ContextMenu.Root>
          </PortalProvider>
        );

        harness.render(renderTree(false));
        waitForEffects(3);

        const hiddenMarker = findTextLabelByText(harness.playerGui, "context-menu-marker-force");
        assert(hiddenMarker !== undefined, "Forced context menu content should stay mounted while closed.");
        const hiddenHost = hiddenMarker.Parent;
        assert(hiddenHost?.IsA("GuiObject"), "Forced context menu marker parent should be a GuiObject.");
        assert(hiddenHost.Visible === false, "Forced context menu content should be hidden while closed.");

        harness.render(renderTree(true));
        waitForEffects(4);

        const visibleMarker = findTextLabelByText(harness.playerGui, "context-menu-marker-force");
        assert(visibleMarker !== undefined, "Forced context menu content should remain mounted when opened.");
        const visibleHost = visibleMarker.Parent;
        assert(visibleHost?.IsA("GuiObject"), "Opened forced context menu marker parent should be a GuiObject.");
        assert(visibleHost.Visible === true, "Forced context menu content should become visible when opened.");
      });
    });

    it("mounts items when opened without touching native gamepad selection", () => {
      withReactHarness("ContextMenuOpenNoNativeSelection", (harness) => {
        GuiService.SelectedObject = undefined;

        harness.render(renderContextMenuTree(harness.playerGui, true));
        waitForEffects(4);

        const alphaItem = findTextButtonByText(harness.playerGui, "context-menu-item-alpha");
        const betaItem = findTextButtonByText(harness.playerGui, "context-menu-item-beta");
        assert(alphaItem !== undefined, "Context menu items should mount when opened.");
        assert(betaItem !== undefined, "Context menu items should mount when opened.");

        assert(
          GuiService.SelectedObject === undefined,
          "Opening ContextMenuContent should not drive native gamepad selection.",
        );
      });
    });
  });
};
