import { TextFieldDescription } from "./TextField/TextFieldDescription";
import { TextFieldInput } from "./TextField/TextFieldInput";
import { TextFieldLabel } from "./TextField/TextFieldLabel";
import { TextFieldMessage } from "./TextField/TextFieldMessage";
import { TextFieldRoot } from "./TextField/TextFieldRoot";

export const TextField = {
  Root: TextFieldRoot,
  Input: TextFieldInput,
  Label: TextFieldLabel,
  Description: TextFieldDescription,
  Message: TextFieldMessage,
} as const;

export { useTextFieldContext } from "./TextField/context";
export type {
  TextFieldCommitValue,
  TextFieldContextValue,
  TextFieldDescriptionProps,
  TextFieldInputProps,
  TextFieldLabelProps,
  TextFieldMessageProps,
  TextFieldProps,
  TextFieldSetValue,
} from "./TextField/types";
