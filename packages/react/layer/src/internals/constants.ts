export const DEFAULT_DISPLAY_ORDER_BASE = 1000;
// Safety net for exit animations whose onExitComplete never fires. Scheduled
// the moment `present` flips false, so it must comfortably exceed the longest
// default exit transition (~120ms, the overlay fade) or it truncates healthy
// animations mid-flight. Consumers with longer custom exits should pass
// exitFallbackMs.
export const DEFAULT_PRESENCE_EXIT_FALLBACK_MS = 1000;
export const DEFAULT_LAYER_IGNORE_GUI_INSET = true;
