import { describe, expect, it } from "vitest";
import { linkPackage, linkPath, shortenPath } from "../../../packages/tools/cli/src/core/output";
import {
  displayWidth,
  hyperlink,
  shouldUseColor,
  shouldUseHyperlinks,
  stripEscapes,
} from "../../../packages/tools/cli/src/core/style";

const ESC = "\u001b";

function stream(isTTY: boolean): NodeJS.WriteStream {
  return { isTTY } as unknown as NodeJS.WriteStream;
}

describe("displayWidth", () => {
  it("ignores colour escapes", () => {
    expect(displayWidth(`${ESC}[31mred${ESC}[0m`)).toBe(3);
  });

  it("ignores hyperlink escapes and counts only the label", () => {
    expect(displayWidth(hyperlink("demo", "https://example.com/a/very/long/url"))).toBe(4);
  });

  it("matches String.length for plain text", () => {
    expect(displayWidth("dialog")).toBe("dialog".length);
  });
});

describe("stripEscapes", () => {
  it("leaves the visible text behind", () => {
    expect(stripEscapes(`${ESC}[1m${hyperlink("dialog", "https://example.com")}${ESC}[0m`)).toBe("dialog");
  });
});

describe("shouldUseColor", () => {
  it("prefers NO_COLOR over everything", () => {
    expect(shouldUseColor(stream(true), undefined, { NO_COLOR: "1", FORCE_COLOR: "1" })).toBe(false);
  });

  it("lets FORCE_COLOR win over a piped stream", () => {
    expect(shouldUseColor(stream(false), undefined, { FORCE_COLOR: "1" })).toBe(true);
    expect(shouldUseColor(stream(true), undefined, { FORCE_COLOR: "0" })).toBe(false);
  });

  it("falls back to TTY detection", () => {
    expect(shouldUseColor(stream(true), undefined, {})).toBe(true);
    expect(shouldUseColor(stream(false), undefined, {})).toBe(false);
    expect(shouldUseColor(stream(true), undefined, { TERM: "dumb" })).toBe(false);
  });
});

describe("shouldUseHyperlinks", () => {
  it("stays off in CI, where the log is read as plain text", () => {
    expect(shouldUseHyperlinks(stream(true), undefined, { CI: "true" })).toBe(false);
  });

  it("can be forced on or off", () => {
    expect(shouldUseHyperlinks(stream(false), undefined, { FORCE_HYPERLINK: "1" })).toBe(true);
    expect(shouldUseHyperlinks(stream(true), undefined, { NO_HYPERLINK: "1" })).toBe(false);
  });

  it("is independent of colour", () => {
    // A user who turned colour off has said nothing about clickable paths.
    expect(shouldUseHyperlinks(stream(true), undefined, { NO_COLOR: "1" })).toBe(true);
  });
});

describe("shortenPath", () => {
  const home = "/Users/dev";

  it("renders a subpath of the cwd relatively", () => {
    expect(shortenPath("/Users/dev/work/app/src", "/Users/dev/work/app", home)).toBe("src");
  });

  it("renders the home directory with a tilde", () => {
    expect(shortenPath("/Users/dev/work/app", "/somewhere/else", home)).toBe("~/work/app");
  });

  it("keeps the absolute path when it is neither", () => {
    expect(shortenPath("/opt/app", "/somewhere/else", home)).toBe("/opt/app");
  });

  it("does not collapse the cwd itself to a dot", () => {
    // `.` would be accurate but would not say which project the command is touching.
    expect(shortenPath("/Users/dev/work/app", "/Users/dev/work/app", home)).toBe("~/work/app");
  });
});

describe("linkPath", () => {
  it("points at the full path while showing the short one", () => {
    const rendered = linkPath("/Users/dev/work/app", "/Users/dev/work");

    expect(stripEscapes(rendered)).toBe("app");
    expect(rendered).toContain("file:///Users/dev/work/app");
  });
});

describe("linkPackage", () => {
  it("strips the version from the URL but keeps it visible", () => {
    const rendered = linkPackage("@lattice-ui/react-dialog@latest");

    expect(stripEscapes(rendered)).toBe("@lattice-ui/react-dialog@latest");
    expect(rendered).toContain("https://www.npmjs.com/package/@lattice-ui/react-dialog");
  });

  it("keeps a scoped name without a version intact", () => {
    // The leading `@` of a scope must not be mistaken for a version separator.
    expect(linkPackage("@rbxts/react")).toContain("https://www.npmjs.com/package/@rbxts/react");
  });

  it("handles an unscoped name", () => {
    expect(linkPackage("roblox-ts")).toContain("https://www.npmjs.com/package/roblox-ts");
  });
});
