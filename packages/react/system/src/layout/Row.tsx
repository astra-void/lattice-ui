import { React } from "@lattice-ui/react-runtime";
import { Stack } from "./Stack";
import type { RowProps } from "./types";

export function Row(props: RowProps) {
  return <Stack {...props} direction="horizontal" />;
}
