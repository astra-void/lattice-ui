import { React } from "@lattice-ui/core";
import { Stack } from "./Stack";
import type { RowProps } from "./types";

export function Row(props: RowProps) {
  return <Stack {...props} direction="horizontal" />;
}
