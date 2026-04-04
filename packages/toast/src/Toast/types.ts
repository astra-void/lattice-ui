import type { MotionTransition } from "@lattice-ui/motion";
import type React from "@rbxts/react";
import type { ToastRecord } from "./queue";

export type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  durationMs?: number;
};

export type ToastContextValue = {
  toasts: Array<ToastRecord>;
  visibleToasts: Array<ToastRecord>;
  defaultDurationMs: number;
  maxVisible: number;
  enqueue: (options: ToastOptions) => string;
  remove: (id: string) => void;
  clear: () => void;
};

export type ToastApi = {
  toasts: Array<ToastRecord>;
  visibleToasts: Array<ToastRecord>;
  enqueue: (options: ToastOptions) => string;
  remove: (id: string) => void;
  clear: () => void;
};

export type ToastProviderProps = {
  defaultDurationMs?: number;
  maxVisible?: number;
  children?: React.ReactNode;
};

export type ToastViewportProps = {
  asChild?: boolean;
  children?: React.ReactNode;
};

export type ToastRootProps = {
  asChild?: boolean;
  visible?: boolean;
  transition?: MotionTransition | false;
  children?: React.ReactNode;
};

export type ToastTitleProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ToastDescriptionProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ToastActionProps = {
  asChild?: boolean;
  onAction?: () => void;
  children?: React.ReactElement;
};

export type ToastCloseProps = {
  asChild?: boolean;
  onClose?: () => void;
  children?: React.ReactElement;
};
