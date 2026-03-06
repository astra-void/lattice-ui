// @vitest-environment jsdom

import { Frame, Slot, TextLabel, UDim2, UIListLayout, UIPadding } from "@lattice-ui/preview/runtime";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
});

describe("preview runtime host mapping", () => {
  it("maps visibility and geometry props to DOM styles", () => {
    render(
      <Frame Position={UDim2.fromOffset(12, 18)} Size={UDim2.fromOffset(120, 48)} Visible={false}>
        Hidden frame
      </Frame>,
    );

    const frame = document.querySelector('[data-preview-host="frame"]') as HTMLElement;
    expect(frame.style.display).toBe("none");
    expect(frame.style.left).toBe("12px");
    expect(frame.style.top).toBe("18px");
    expect(frame.style.width).toBe("120px");
    expect(frame.style.height).toBe("48px");
  });

  it("merges slot and child activated handlers", async () => {
    const user = userEvent.setup();
    const childActivated = vi.fn();
    const slotActivated = vi.fn();

    render(
      <Slot Event={{ Activated: () => slotActivated() }}>
        <button onClick={() => childActivated()} type="button">
          Trigger
        </button>
      </Slot>,
    );

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    expect(childActivated).toHaveBeenCalledTimes(1);
    expect(slotActivated).toHaveBeenCalledTimes(1);
  });

  it("renders expanded host support without leaking preview-only props to the DOM", () => {
    render(
      <Frame>
        <UIListLayout FillDirection="vertical" SortOrder="layout-order" />
        <UIPadding PaddingLeft="10px" />
        <TextLabel Text="Hello preview" TextXAlignment="left" />
      </Frame>,
    );

    expect(screen.getByText("Hello preview")).toBeTruthy();
    expect(document.querySelector('[data-preview-host="uilistlayout"]')).toBeTruthy();
    expect(document.querySelector("[filldirection]")).toBeNull();
  });
});
