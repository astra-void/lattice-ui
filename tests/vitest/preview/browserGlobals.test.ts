// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { installPreviewBrowserGlobals } from "../../../packages/preview/src/shell/installPreviewBrowserGlobals";

type PreviewGlobalRecord = typeof globalThis & {
  Enum?: unknown;
};

const globalRecord = globalThis as PreviewGlobalRecord;
const initialEnum = globalRecord.Enum;
const globalPrototypeHost = Object.getPrototypeOf(globalThis);
const initialGlobalPrototypeParent = globalPrototypeHost ? Object.getPrototypeOf(globalPrototypeHost) : null;
const windowPrototypeHost = typeof window !== "undefined" ? Object.getPrototypeOf(window) : null;
const initialWindowPrototypeParent = windowPrototypeHost ? Object.getPrototypeOf(windowPrototypeHost) : null;

afterEach(() => {
  if (initialEnum === undefined) {
    delete globalRecord.Enum;
  } else {
    globalRecord.Enum = initialEnum;
  }

  if (globalPrototypeHost && Object.getPrototypeOf(globalPrototypeHost) !== initialGlobalPrototypeParent) {
    Object.setPrototypeOf(globalPrototypeHost, initialGlobalPrototypeParent);
  }

  if (windowPrototypeHost && Object.getPrototypeOf(windowPrototypeHost) !== initialWindowPrototypeParent) {
    Object.setPrototypeOf(windowPrototypeHost, initialWindowPrototypeParent);
  }
});

describe("installPreviewBrowserGlobals", () => {
  it("installs a proxy-backed Enum mock that tolerates arbitrary access", () => {
    delete globalRecord.Enum;

    installPreviewBrowserGlobals();

    const enumRoot = globalRecord.Enum as {
      GetEnums: () => unknown[];
      KeyCode: {
        FromName: (name: string) => { Name: string; Value: number };
        Return: { Name: string; Value: number };
      };
      TextXAlignment: {
        Center: { Name: string; Value: number };
      };
    };

    expect(enumRoot.GetEnums()).toEqual([]);
    expect(enumRoot.KeyCode.Return).toMatchObject({ Name: "Return" });
    expect(enumRoot.KeyCode.Return.Value).toEqual(expect.any(Number));
    expect(enumRoot.KeyCode.FromName("Escape")).toMatchObject({ Name: "Escape" });
    expect(enumRoot.TextXAlignment.Center.Name).toBe("Center");
  });

  it("does not overwrite an existing Enum global", () => {
    const existingEnum = { existing: true };
    globalRecord.Enum = existingEnum;

    installPreviewBrowserGlobals();

    expect(globalRecord.Enum).toBe(existingEnum);
  });

  it("installs a catch-all fallback for arbitrary Roblox globals", () => {
    delete globalRecord.Enum;

    installPreviewBrowserGlobals();

    const result = Function(`
      "use strict";
      return {
        stringSize: "Spell".size(),
        tostringValue: tostring(42),
        tweenInfoType: typeof TweenInfo,
        taskDelayType: typeof task.delay,
        tostringType: typeof tostring,
        tweenInfoInstance: new TweenInfo(0.14),
        service: game.GetService("Players"),
        workspaceValue: workspace,
      };
    `)() as {
      stringSize: number;
      tostringValue: string;
      tweenInfoType: string;
      taskDelayType: string;
      tostringType: string;
      tweenInfoInstance: unknown;
      service: unknown;
      workspaceValue: unknown;
    };

    expect(result.stringSize).toBe(5);
    expect(result.tostringValue).toBe("42");
    expect(result.tweenInfoType).toBe("function");
    expect(result.taskDelayType).toBe("function");
    expect(result.tostringType).toBe("function");
    expect(result.tweenInfoInstance).toBeDefined();
    expect(result.service).toBeDefined();
    expect(result.workspaceValue).toBeDefined();
  });
});
