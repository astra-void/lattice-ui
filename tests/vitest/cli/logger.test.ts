import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "../../../packages/cli/src/core/logger";

function createReadStream(isTTY: boolean) {
  const stream = new PassThrough();
  (stream as unknown as { isTTY: boolean }).isTTY = isTTY;
  return stream as unknown as NodeJS.ReadStream;
}

function readStreamContent(stream: PassThrough): string {
  return stream.read()?.toString("utf8") ?? "";
}

describe("logger output styling", () => {
  it("uses ANSI color codes in TTY mode", () => {
    const stdoutRaw = new PassThrough();
    const stderrRaw = new PassThrough();
    (stdoutRaw as unknown as { isTTY: boolean }).isTTY = true;
    (stderrRaw as unknown as { isTTY: boolean }).isTTY = true;

    const logger = createLogger({
      verbose: false,
      yes: true,
      stdin: createReadStream(true),
      stdout: stdoutRaw as unknown as NodeJS.WriteStream,
      stderr: stderrRaw as unknown as NodeJS.WriteStream,
    });

    logger.section("Summary");
    logger.kv("Errors", "0");
    logger.step("Run build");
    logger.list(["one", "two"]);
    logger.success("Done");
    logger.warn("Warning");
    logger.error("Failure");

    const stdoutText = readStreamContent(stdoutRaw);
    const stderrText = readStreamContent(stderrRaw);

    expect(stdoutText).toContain("\u001b[");
    expect(stderrText).toContain("\u001b[");
    expect(stdoutText).toContain("?");
    expect(stdoutText).toContain("›");
    expect(stdoutText).toContain("✔");
    expect(stderrText).toContain("⚠");
    expect(stderrText).toContain("✖");
  });

  it("keeps plain text in non-TTY mode", () => {
    const stdoutRaw = new PassThrough();
    const stderrRaw = new PassThrough();
    (stdoutRaw as unknown as { isTTY: boolean }).isTTY = false;
    (stderrRaw as unknown as { isTTY: boolean }).isTTY = false;

    const logger = createLogger({
      verbose: false,
      yes: true,
      stdin: createReadStream(false),
      stdout: stdoutRaw as unknown as NodeJS.WriteStream,
      stderr: stderrRaw as unknown as NodeJS.WriteStream,
    });

    logger.section("Summary");
    logger.kv("Warnings", "2");
    logger.success("Done");
    logger.warn("Warning");

    const stdoutText = readStreamContent(stdoutRaw);
    const stderrText = readStreamContent(stderrRaw);

    expect(stdoutText).not.toContain("\u001b[");
    expect(stderrText).not.toContain("\u001b[");
    expect(stdoutText).toContain("[>] Summary");
    expect(stdoutText).toContain("[?] Warnings: 2");
    expect(stdoutText).toContain("[+] Done");
    expect(stderrText).toContain("[!] Warning");
  });
});
