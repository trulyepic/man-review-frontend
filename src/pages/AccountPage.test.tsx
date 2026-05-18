import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AccountPage from "./AccountPage";
import { UserContext } from "../login/UserContext";
import type { User } from "../types/types";

function renderAccountPage(user: User | null) {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{ user, setUser: vi.fn() }}>
        <AccountPage />
      </UserContext.Provider>
    </MemoryRouter>
  );
}

describe("AccountPage", () => {
  it("prompts anonymous users to log in", () => {
    renderAccountPage(null);

    expect(
      screen.getByText(/log in to update your toon ranks avatar/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("renders avatar controls for signed-in users", () => {
    renderAccountPage({
      id: 1,
      username: "reader",
      role: "GENERAL",
      avatar_url: null,
      avatar_preset: "emerald",
    });

    expect(
      screen.getByRole("heading", { name: /your profile/i })
    ).toBeInTheDocument();
    expect(screen.getByText("reader")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /blue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /emerald/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /amber/i })).toBeInTheDocument();
  });
});
