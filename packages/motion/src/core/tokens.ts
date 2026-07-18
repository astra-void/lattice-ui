/**
 * Canonical presence-motion tokens.
 *
 * Every built-in enter/exit recipe derives its default duration and travel
 * distance from these values so that components share one coherent motion feel.
 * Override per call site only for a deliberate, documented exception — not to
 * reintroduce ad-hoc magic numbers.
 */

/** Reveal (enter) durations, in seconds. Exit is always {@link motionExitDuration}. */
export const motionDuration = {
  /** Standard reveal for surfaces, popper-anchored content, and dialogs. */
  reveal: 0.12,
  /** Scrim / backdrop fade — intentionally a touch slower than a surface reveal. */
  overlay: 0.15,
  /** Toast reveal — slightly softer than the standard surface reveal. */
  toast: 0.14,
} as const;

/** Exit animations run this fraction of their reveal duration across the board. */
export const MOTION_EXIT_SCALE = 0.8;

/** Canonical exit duration for a given reveal duration. */
export function motionExitDuration(revealDuration: number): number {
  return revealDuration * MOTION_EXIT_SCALE;
}

/** Travel distances (px) for enter/exit offset animations. */
export const motionOffset = {
  /** Popper-anchored floating surfaces: menu, popover, select, combobox, tooltip. */
  popper: 10,
  /** In-flow reveals that slide from their own edge: accordion, tabs, dialog content. */
  surface: 8,
} as const;

/**
 * Response (settle) durations, in seconds — how fast a value follows to its
 * target. Drives the half-life in {@link resolveResponseDriver}, so these read
 * as "time to feel settled", not a hard tween length.
 */
export const motionSettle = {
  /** State feedback on selectable items: menu, select, radio, checkbox, tabs, toggle-group, accordion trigger. */
  selection: 0.1,
  /** Input field focus / appearance: text-field, textarea. */
  field: 0.1,
  /** On/off toggle travel: switch. */
  toggle: 0.08,
  /** Value-driven fill that follows a target: progress, slider range at rest. */
  progress: 0.12,
  /** Toast surface settle — a touch softer than the standard settle. */
  toast: 0.14,
} as const;

/** Direct-manipulation follow durations for draggable controls (slider). */
export const motionDrag = {
  /** While actively dragging — near-instant follow. */
  active: 0.03,
  /** Settling after release. */
  idle: 0.04,
} as const;
