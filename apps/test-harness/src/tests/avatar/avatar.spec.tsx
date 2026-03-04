import { Avatar } from "@lattice-ui/avatar";
import { React } from "@lattice-ui/core";
import { findTextLabelByText } from "../../test-utils/guiFind";
import { waitForEffects, withReactHarness } from "../../test-utils/reactHarness";

export = () => {
  describe("avatar", () => {
    it("shows fallback when src is missing", () => {
      withReactHarness("AvatarFallback", (harness) => {
        harness.render(
          <Avatar.Root delayMs={0}>
            <Avatar.Image asChild>
              <imagelabel />
            </Avatar.Image>
            <Avatar.Fallback asChild>
              <textlabel Text="avatar-fallback-visible" />
            </Avatar.Fallback>
          </Avatar.Root>,
        );

        waitForEffects(2);
        const fallback = findTextLabelByText(harness.container, "avatar-fallback-visible");
        assert(fallback !== undefined, "AvatarFallback should mount when image source is missing.");
        assert(fallback.Visible === true, "Fallback should be visible when src is missing.");
      });
    });
  });
};
