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
} as const;

export { useToast } from "./Toast/ToastProvider";
export { dequeueToast, enqueueToast, getVisibleToasts, pruneExpiredToasts } from "./Toast/queue";
export type { ToastRecord } from "./Toast/queue";
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
