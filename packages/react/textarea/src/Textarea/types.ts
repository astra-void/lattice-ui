import type { PassthroughProps } from "@lattice-ui/react-runtime";
import type React from "@rbxts/react";

export type TextareaSetValue = (value: string) => void;
export type TextareaCommitValue = (value: string) => void;

export type TextareaContextValue = {
  value: string;
  setValue: TextareaSetValue;
  commitValue: TextareaCommitValue;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
  name?: string;
  autoResize: boolean;
  minRows: number;
  maxRows?: number;
  inputRef: React.MutableRefObject<TextBox | undefined>;
};

export type TextareaProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onValueCommit?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  children?: React.ReactNode;
};

export type TextareaInputProps = {
  asChild?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  lineHeight?: number;
  children?: React.ReactElement;
} & PassthroughProps;

export type TextareaLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

export type TextareaDescriptionProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

export type TextareaMessageProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;
