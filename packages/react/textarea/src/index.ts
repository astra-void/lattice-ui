import { TextareaDescription } from "./Textarea/TextareaDescription";
import { TextareaInput } from "./Textarea/TextareaInput";
import { TextareaLabel } from "./Textarea/TextareaLabel";
import { TextareaMessage } from "./Textarea/TextareaMessage";
import { TextareaRoot } from "./Textarea/TextareaRoot";

export const Textarea = {
  Root: TextareaRoot,
  Input: TextareaInput,
  Label: TextareaLabel,
  Description: TextareaDescription,
  Message: TextareaMessage,
} as const;

export { resolveTextareaHeight } from "./Textarea/autoResize";
export type {
  TextareaCommitValue,
  TextareaContextValue,
  TextareaDescriptionProps,
  TextareaInputProps,
  TextareaLabelProps,
  TextareaMessageProps,
  TextareaProps,
  TextareaSetValue,
} from "./Textarea/types";
