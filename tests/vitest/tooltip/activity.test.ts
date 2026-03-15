import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE,
  updateTooltipTriggerActivity,
} from "../../../packages/tooltip/src/Tooltip/activity";

describe("tooltip trigger activity", () => {
  it("opens on the first hover activation and closes after the last activity ends", () => {
    const hovered = updateTooltipTriggerActivity(DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE, "hover", true);
    expect(hovered.action).toBe("open");

    const closed = updateTooltipTriggerActivity(hovered.state, "hover", false);
    expect(closed.action).toBe("close");
  });

  it("opens on focus activation when the trigger was previously inactive", () => {
    const focused = updateTooltipTriggerActivity(DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE, "focus", true);
    expect(focused.action).toBe("open");

    const closed = updateTooltipTriggerActivity(focused.state, "focus", false);
    expect(closed.action).toBe("close");
  });

  it("keeps the tooltip active while hover and focus overlap", () => {
    const hovered = updateTooltipTriggerActivity(DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE, "hover", true);
    const focused = updateTooltipTriggerActivity(hovered.state, "focus", true);
    const hoverEnded = updateTooltipTriggerActivity(focused.state, "hover", false);
    const focusEnded = updateTooltipTriggerActivity(hoverEnded.state, "focus", false);

    expect(hovered.action).toBe("open");
    expect(focused.action).toBe("none");
    expect(hoverEnded.action).toBe("none");
    expect(focusEnded.action).toBe("close");
  });

  it("does not request another delayed open while the trigger is already active", () => {
    const hovered = updateTooltipTriggerActivity(DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE, "hover", true);
    const focused = updateTooltipTriggerActivity(hovered.state, "focus", true);

    expect(hovered.action).toBe("open");
    expect(focused.action).toBe("none");
  });
});
