import type React from "@rbxts/react";

export type TextFieldSetValue = (value: string) => void;
export type TextFieldCommitValue = (value: string) => void;

export type TextFieldContextValue = {
  value: string;
  setValue: TextFieldSetValue;
  commitValue: TextFieldCommitValue;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
  name?: string;
  inputRef: React.MutableRefObject<TextBox | undefined>;
};

export type TextFieldProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onValueCommit?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  children?: React.ReactNode;
};

export type TextFieldInputProps = {
  asChild?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  children?: React.ReactElement;
};

export type TextFieldLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type TextFieldDescriptionProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type TextFieldMessageProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
