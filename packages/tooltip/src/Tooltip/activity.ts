export type TooltipTriggerActivityKind = "hover" | "focus";

export type TooltipTriggerActivityState = {
  hover: boolean;
  focus: boolean;
};

export type TooltipTriggerActivityResult = {
  action: "open" | "close" | "none";
  state: TooltipTriggerActivityState;
};

export const DEFAULT_TOOLTIP_TRIGGER_ACTIVITY_STATE: TooltipTriggerActivityState = {
  hover: false,
  focus: false,
};

export function updateTooltipTriggerActivity(
  state: TooltipTriggerActivityState,
  kind: TooltipTriggerActivityKind,
  active: boolean,
): TooltipTriggerActivityResult {
  const nextState: TooltipTriggerActivityState = {
    ...state,
    [kind]: active,
  };

  const wasActive = state.hover || state.focus;
  const isActive = nextState.hover || nextState.focus;

  if (!wasActive && isActive) {
    return {
      action: "open",
      state: nextState,
    };
  }

  if (wasActive && !isActive) {
    return {
      action: "close",
      state: nextState,
    };
  }

  return {
    action: "none",
    state: nextState,
  };
}
