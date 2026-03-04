import { React } from "@lattice-ui/core";
import { FocusScope } from "@lattice-ui/focus";
import { findTextButtonByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

const GuiService = game.GetService("GuiService");

function findButtonOrThrow(root: Instance, text: string) {
  const button = findTextButtonByText(root, text);
  assert(button !== undefined, `Expected TextButton "${text}" to exist.`);
  return button;
}

export = () => {
  describe("focus-scope", () => {
    it("redirects outside selection into trapped scope", () => {
      withReactHarness("FocusScopeTrapRedirect", (harness) => {
        harness.render(
          <frame>
            <textbutton Text="focus-scope-outside-trap" />
            <FocusScope asChild trapped={true}>
              <frame>
                <textbutton Text="focus-scope-inside-trap" />
              </frame>
            </FocusScope>
          </frame>,
        );

        waitForEffects(3);
        const outside = findButtonOrThrow(harness.container, "focus-scope-outside-trap");
        const inside = findButtonOrThrow(harness.container, "focus-scope-inside-trap");

        GuiService.SelectedObject = outside;
        waitForEffects(3);

        assert(
          GuiService.SelectedObject === inside,
          "Trapped FocusScope should redirect outside selection to an in-scope selectable target.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("does not trap when active is false", () => {
      withReactHarness("FocusScopeInactive", (harness) => {
        harness.render(
          <frame>
            <textbutton Text="focus-scope-outside-inactive" />
            <FocusScope active={false} asChild trapped={true}>
              <frame>
                <textbutton Text="focus-scope-inside-inactive" />
              </frame>
            </FocusScope>
          </frame>,
        );

        waitForEffects(3);
        const outside = findButtonOrThrow(harness.container, "focus-scope-outside-inactive");

        GuiService.SelectedObject = outside;
        waitForEffects(3);

        assert(
          GuiService.SelectedObject === outside,
          "Inactive FocusScope should not change SelectedObject even when trapped is true.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("restores previous focus when scope unmounts", () => {
      withReactHarness("FocusScopeRestore", (harness) => {
        const renderTree = (open: boolean) => (
          <frame>
            <textbutton Text="focus-scope-outside-restore" />
            {open ? (
              <FocusScope asChild restoreFocus={true} trapped={true}>
                <frame>
                  <textbutton Text="focus-scope-inside-restore" />
                </frame>
              </FocusScope>
            ) : undefined}
          </frame>
        );

        harness.render(renderTree(false));
        waitForEffects(2);

        const outsideBeforeOpen = findButtonOrThrow(harness.container, "focus-scope-outside-restore");
        GuiService.SelectedObject = outsideBeforeOpen;
        waitForEffects(2);

        harness.render(renderTree(true));
        waitForEffects(3);

        const inside = findButtonOrThrow(harness.container, "focus-scope-inside-restore");
        assert(
          GuiService.SelectedObject === inside,
          "Trapped FocusScope should move focus inside while active in restore test.",
        );

        harness.render(renderTree(false));
        waitForEffects(3);

        const outsideAfterClose = findButtonOrThrow(harness.container, "focus-scope-outside-restore");
        assert(
          GuiService.SelectedObject === outsideAfterClose,
          "FocusScope should restore captured selection when it unmounts.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("releases trap ownership and listeners after unmount cleanup", () => {
      withReactHarness("FocusScopeUnmountCleanup", (harness) => {
        const renderTree = (open: boolean) => (
          <frame>
            <textbutton Text="focus-scope-outside-unmount" />
            {open ? (
              <FocusScope asChild restoreFocus={true} trapped={true}>
                <frame>
                  <textbutton Text="focus-scope-inside-unmount" />
                </frame>
              </FocusScope>
            ) : undefined}
          </frame>
        );

        harness.render(renderTree(true));
        waitForEffects(3);

        const outside = findButtonOrThrow(harness.container, "focus-scope-outside-unmount");
        const inside = findButtonOrThrow(harness.container, "focus-scope-inside-unmount");

        GuiService.SelectedObject = outside;
        waitForEffects(3);

        assert(
          GuiService.SelectedObject === inside,
          "Mounted trapped FocusScope should redirect outside focus before unmount.",
        );

        harness.render(renderTree(false));
        waitForEffects(3);

        const outsideAfterClose = findButtonOrThrow(harness.container, "focus-scope-outside-unmount");
        GuiService.SelectedObject = outsideAfterClose;
        waitForEffects(3);

        assert(
          GuiService.SelectedObject === outsideAfterClose,
          "FocusScope should stop trapping after cleanup and keep outside focus untouched.",
        );

        GuiService.SelectedObject = undefined;
      });
    });

    it("enforces trap only on top-most nested scope", () => {
      withReactHarness("FocusScopeNested", (harness) => {
        const renderTree = (innerOpen: boolean) => (
          <frame>
            <textbutton Text="focus-scope-outside-nested" />
            <FocusScope asChild trapped={true}>
              <frame>
                <textbutton Text="focus-scope-outer-nested" />
                {innerOpen ? (
                  <FocusScope asChild trapped={true}>
                    <frame>
                      <textbutton Text="focus-scope-inner-nested" />
                    </frame>
                  </FocusScope>
                ) : undefined}
              </frame>
            </FocusScope>
          </frame>
        );

        harness.render(renderTree(true));
        waitForEffects(3);

        const outside = findButtonOrThrow(harness.container, "focus-scope-outside-nested");
        const inner = findButtonOrThrow(harness.container, "focus-scope-inner-nested");

        GuiService.SelectedObject = outside;
        waitForEffects(3);

        assert(
          GuiService.SelectedObject === inner,
          "When nested scopes are active, the latest trapped scope should own redirection.",
        );

        harness.render(renderTree(false));
        waitForEffects(3);

        const outsideAfterInnerClose = findButtonOrThrow(harness.container, "focus-scope-outside-nested");
        const outerAfterInnerClose = findButtonOrThrow(harness.container, "focus-scope-outer-nested");

        GuiService.SelectedObject = outsideAfterInnerClose;
        waitForEffects(3);

        assert(
          GuiService.SelectedObject === outerAfterInnerClose,
          "After inner scope closes, outer trapped scope should resume redirection ownership.",
        );

        GuiService.SelectedObject = undefined;
      });
    });
  });
};
