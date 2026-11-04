export interface SpawnInvocation {
  command: string;
  args: string[];
  shell: boolean;
}

/** Characters cmd.exe and the MS C runtime both pass through untouched outside quotes. */
const PLAIN_WINDOWS_ARG = /^[\w\-+./:@=]+$/;

/**
 * Quotes one argument for the `cmd.exe /d /s /c "<line>"` command line that `shell: true` runs
 * on Windows.
 *
 * Inside double quotes cmd.exe leaves spaces and `& | < > ^` alone, and stays inside them when an
 * `npm.cmd`-style shim re-expands `%*`. An embedded quote is doubled so cmd's quote state stays in
 * step; the C runtime reads `""` inside a quoted argument as one literal quote. Backslashes only
 * escape before a quote, so a run of them before one (or before the closing quote) is doubled.
 * `%VAR%` still expands — cmd offers no escape for it inside a `/c` line.
 */
export function quoteWindowsArg(arg: string): string {
  if (PLAIN_WINDOWS_ARG.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/(\\*)"/g, '$1$1""').replace(/(\\+)$/, "$1$1")}"`;
}

/**
 * How to spawn `command args` on this platform.
 *
 * On Windows, npm, pnpm and yarn are `.cmd` shims that only start through a shell. Passing an
 * args array alongside `shell: true` joins it with spaces and no escaping, which Node 24
 * deprecates (DEP0190), so the one command line is built and quoted here instead.
 */
export function toSpawnInvocation(
  command: string,
  args: string[],
  platform: NodeJS.Platform = process.platform,
): SpawnInvocation {
  if (platform !== "win32") {
    return { command, args, shell: false };
  }

  return { command: [command, ...args].map(quoteWindowsArg).join(" "), args: [], shell: true };
}
