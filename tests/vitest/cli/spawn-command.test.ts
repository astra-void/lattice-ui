import { describe, expect, it } from "vitest";
import { linkPath } from "../../../packages/tools/cli/src/core/output";
import { quoteWindowsArg, toSpawnInvocation } from "../../../packages/tools/cli/src/core/spawnCommand";

describe("toSpawnInvocation", () => {
  it("passes the args array through without a shell off Windows", () => {
    expect(toSpawnInvocation("npm", ["install", "--save-dev", "@rbxts/react@^17"], "darwin")).toEqual({
      command: "npm",
      args: ["install", "--save-dev", "@rbxts/react@^17"],
      shell: false,
    });
  });

  it("builds one quoted command line on Windows instead of shell args (DEP0190)", () => {
    expect(
      toSpawnInvocation(
        "npm",
        ["install", "--save-dev", "@lattice-ui/react-dialog@0.8.1", "@rbxts/react@^17"],
        "win32",
      ),
    ).toEqual({
      command: 'npm install --save-dev @lattice-ui/react-dialog@0.8.1 "@rbxts/react@^17"',
      args: [],
      shell: true,
    });
  });

  it("quotes an executable path with spaces", () => {
    expect(toSpawnInvocation("C:\\Program Files\\nodejs\\node.exe", ["-e", "process.exit(0)"], "win32").command).toBe(
      '"C:\\Program Files\\nodejs\\node.exe" -e "process.exit(0)"',
    );
  });
});

describe("quoteWindowsArg", () => {
  it("leaves plain package specs, flags and paths bare", () => {
    for (const arg of ["install", "--save-dev", "-D", "@scope/name@1.2.3", "typescript@5.5.3", "C:/work/app", "a=b"]) {
      expect(quoteWindowsArg(arg)).toBe(arg);
    }
  });

  it("quotes cmd.exe metacharacters and whitespace", () => {
    expect(quoteWindowsArg("^1.0.0")).toBe('"^1.0.0"');
    expect(quoteWindowsArg("a&b|c<d>e")).toBe('"a&b|c<d>e"');
    expect(quoteWindowsArg("my game")).toBe('"my game"');
    expect(quoteWindowsArg("")).toBe('""');
  });

  it("doubles embedded quotes and the backslashes in front of them", () => {
    expect(quoteWindowsArg('say "hi"')).toBe('"say ""hi"""');
    expect(quoteWindowsArg('a\\"b')).toBe('"a\\\\""b"');
  });

  it("doubles trailing backslashes so they do not escape the closing quote", () => {
    expect(quoteWindowsArg("C:\\my dir\\")).toBe('"C:\\my dir\\\\"');
  });
});

describe("linkPath file URLs", () => {
  it("percent-encodes characters a raw file:// string would leave broken", () => {
    const rendered = linkPath("/Users/dev/my game#1", "/elsewhere");

    expect(rendered).toContain("file:///Users/dev/my%20game%231");
  });
});
