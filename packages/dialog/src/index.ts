import { DialogClose } from "./Dialog/DialogClose";
import { DialogContent } from "./Dialog/DialogContent";
import { DialogOverlay } from "./Dialog/DialogOverlay";
import { DialogPortal } from "./Dialog/DialogPortal";
import { Dialog as DialogRoot } from "./Dialog/DialogRoot";
import { DialogTrigger } from "./Dialog/DialogTrigger";

export const Dialog = Object.assign(DialogRoot, {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Content: DialogContent,
  Overlay: DialogOverlay,
  Close: DialogClose,
}) as typeof DialogRoot & {
  Root: typeof DialogRoot;
  Trigger: typeof DialogTrigger;
  Portal: typeof DialogPortal;
  Content: typeof DialogContent;
  Overlay: typeof DialogOverlay;
  Close: typeof DialogClose;
};

export { DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger };

export type {
  DialogCloseProps,
  DialogContentProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogProps,
  DialogTriggerProps,
} from "./Dialog/types";
