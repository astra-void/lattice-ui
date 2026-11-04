import { ToastAction } from "./Toast/ToastAction";
import { ToastClose } from "./Toast/ToastClose";
import { ToastDescription } from "./Toast/ToastDescription";
import { ToastProvider } from "./Toast/ToastProvider";
import { ToastRoot } from "./Toast/ToastRoot";
import { ToastTitle } from "./Toast/ToastTitle";
import { ToastViewport } from "./Toast/ToastViewport";

export const Toast = {
  Provider: ToastProvider,
  Viewport: ToastViewport,
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
} as const satisfies {
  Provider: typeof ToastProvider;
  Viewport: typeof ToastViewport;
  Root: typeof ToastRoot;
  Title: typeof ToastTitle;
  Description: typeof ToastDescription;
  Action: typeof ToastAction;
  Close: typeof ToastClose;
};

export type { ToastRecord } from "./Toast/queue";
export {
  clearToasts,
  dequeueToast,
  enqueueToast,
  finalizeToast,
  getVisibleToasts,
  pruneExpiredToasts,
  TOAST_EXIT_TIMEOUT_MS,
} from "./Toast/queue";
export { useToast } from "./Toast/ToastProvider";
export type {
  ToastActionProps,
  ToastCloseProps,
  ToastContextValue,
  ToastDescriptionProps,
  ToastOptions,
  ToastProviderProps,
  ToastRootProps,
  ToastTitleProps,
  ToastViewportProps,
} from "./Toast/types";
export { ToastAction, ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport };
