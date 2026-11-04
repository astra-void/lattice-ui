// @ts-nocheck
import { describe, expect, it } from "vitest";
import { mergeGuiProps } from "../../../packages/react/style/src/sx/mergeGuiProps";

describe("mergeGuiProps", () => {
  it("lets later layers win for plain props", () => {
    const merged = mergeGuiProps(
      { Name: "base", Visible: true, ZIndex: 1 },
      { Name: "variant", ZIndex: 2 },
      { Name: "user" },
    );

    expect(merged).toEqual({ Name: "user", Visible: true, ZIndex: 2 });
  });

  it("accepts missing layers", () => {
    expect(mergeGuiProps()).toEqual({});
    expect(mergeGuiProps(undefined, { Name: "variant" }, undefined)).toEqual({ Name: "variant" });
    expect(mergeGuiProps({ Name: "base" })).toEqual({ Name: "base" });
  });

  it("composes Event handlers per key in base, variant, user order", () => {
    const calls: string[] = [];
    const merged = mergeGuiProps(
      { Event: { Activated: (...args) => calls.push(`base:${args.join(",")}`) } },
      {
        Event: {
          Activated: (...args) => calls.push(`variant:${args.join(",")}`),
          MouseEnter: () => calls.push("variant-enter"),
        },
      },
      { Event: { Activated: (...args) => calls.push(`user:${args.join(",")}`) } },
    );

    merged.Event.Activated("rbx", 1);
    merged.Event.MouseEnter();

    expect(calls).toEqual(["base:rbx,1", "variant:rbx,1", "user:rbx,1", "variant-enter"]);
  });

  it("composes Change handlers the same way", () => {
    const calls: string[] = [];
    const merged = mergeGuiProps(
      { Change: { AbsoluteSize: () => calls.push("base") } },
      undefined,
      { Change: { AbsoluteSize: () => calls.push("user"), Text: () => calls.push("user-text") } },
    );

    merged.Change.AbsoluteSize();
    merged.Change.Text();

    expect(calls).toEqual(["base", "user", "user-text"]);
  });

  it("passes a single handler through untouched", () => {
    const onActivated = () => {};
    const merged = mergeGuiProps({ Name: "base" }, { Event: { Activated: onActivated } });

    expect(merged.Event.Activated).toBe(onActivated);
  });

  it("ignores non-function handler entries and leaves Event unset when none remain", () => {
    const onActivated = () => {};
    const merged = mergeGuiProps({ Event: { Activated: onActivated } }, { Event: { Activated: "nope" } });

    expect(merged.Event).toEqual({ Activated: onActivated });

    const empty = mergeGuiProps({ Name: "base" }, { Name: "variant" });
    expect("Event" in empty).toBe(false);
    expect("Change" in empty).toBe(false);
  });
});
