import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UserAvatar from "./UserAvatar";
import { getAvatarInitials, normalizeAvatarPreset } from "../util/avatar";

describe("avatar helpers", () => {
  it("normalizes unknown presets to the default", () => {
    expect(normalizeAvatarPreset("emerald")).toBe("emerald");
    expect(normalizeAvatarPreset("unknown")).toBe("blue");
    expect(normalizeAvatarPreset(null)).toBe("blue");
  });

  it("builds compact username initials", () => {
    expect(getAvatarInitials("reader")).toBe("RE");
    expect(getAvatarInitials("Toon Ranks")).toBe("TR");
    expect(getAvatarInitials("")).toBe("?");
  });
});

describe("UserAvatar", () => {
  it("renders uploaded avatars as images", () => {
    render(
      <UserAvatar
        username="reader"
        avatarUrl="https://cdn.example.com/avatar.webp"
      />
    );

    expect(screen.getByRole("img", { name: "reader's avatar" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/avatar.webp"
    );
  });

  it("renders preset initials when no avatar URL exists", () => {
    render(<UserAvatar username="Toon Ranks" avatarPreset="amber" />);

    expect(screen.getByLabelText("Toon Ranks's avatar")).toHaveTextContent("TR");
  });
});
