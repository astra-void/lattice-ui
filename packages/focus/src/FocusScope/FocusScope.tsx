import type { FocusScopeProps } from "./types";

export function FocusScope(props: FocusScopeProps) {
  return props.children as never;
}
