import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";
import Footer from "../components/Footer";
import PrivacyPage from "./PrivacyPage";
import RankingsInfoPage from "./RankingsInfoPage";
import TermsPage from "./TermsPage";
import { CONTACT_EMAIL, OPERATOR_NAME, SITE_NAME } from "../config/site";

describe("public information pages", () => {
  it("renders the About page brand content", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: `About ${SITE_NAME}` })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/community-powered experience/i)
    ).toBeInTheDocument();
  });

  it("renders the Contact page operator and email", () => {
    render(<ContactPage />);

    expect(
      screen.getByText(new RegExp(`operated by ${OPERATOR_NAME}`, "i"))
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: CONTACT_EMAIL })
    ).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
  });

  it("renders the Rankings info page scoring explanation", () => {
    render(<RankingsInfoPage />);

    expect(
      screen.getByRole("heading", { name: /how rankings work/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Final Score =/i)).toBeInTheDocument();
  });

  it("renders Terms content for ratings and user content", () => {
    render(<TermsPage />);

    expect(
      screen.getByRole("heading", { name: /terms of service/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ratings, votes, and rankings/i })
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(OPERATOR_NAME, "i"))).toBeInTheDocument();
  });

  it("renders Privacy content for account and analytics data", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: /privacy policy/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Google sign-in/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /security, captcha, and analytics/i })
    ).toBeInTheDocument();
  });
});

describe("footer public links", () => {
  it("renders operator text and legal links", () => {
    render(<Footer />);

    expect(
      screen.getByText(
        new RegExp(`${new Date().getFullYear()} ${SITE_NAME}\\. Operated by ${OPERATOR_NAME}\\.`, "i")
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /terms/i })).toHaveAttribute(
      "href",
      "/terms"
    );
    expect(screen.getByRole("link", { name: /privacy/i })).toHaveAttribute(
      "href",
      "/privacy"
    );
  });
});
