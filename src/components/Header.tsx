import {
  Bars3Icon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { useSearch } from "./SearchContext";
import { useUser } from "../login/useUser";
import SocialLinks from "./SocialLinks";
import myHomeLogo from "../images/logo/myHomeLogo.png";
import { useTheme } from "./ThemeContext";
import { canSubmitSeriesUser, isAdminUser } from "../util/roleUtils";

const DEFAULT_LABEL = "ALL";

const selectedNavClasses =
  "bg-[linear-gradient(135deg,_#315ff4,_#2347c5)] text-white shadow-[0_12px_26px_-18px_rgba(35,71,197,0.7)] ring-1 ring-inset ring-blue-500/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_40%),linear-gradient(145deg,_rgba(34,63,124,0.96),_rgba(23,44,96,0.96))] dark:text-white dark:ring-[#3056a5]";

const desktopNavLink = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-3 py-2 text-sm font-semibold tracking-wide transition",
    isActive
      ? selectedNavClasses
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#241d19] dark:hover:text-white",
  ].join(" ");

const authLink = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-3 py-2 text-sm font-semibold transition",
    isActive
      ? selectedNavClasses
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#241d19] dark:hover:text-white",
  ].join(" ");

const Header = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchTerm, setSearchTerm } = useSearch();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = isAdminUser(user);
  const canSubmit = canSubmitSeriesUser(user);

  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(DEFAULT_LABEL);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const handleSearchClick = () => {
    setShowSearch((prev) => !prev);
  };

  const handleHomeClick = () => {
    setSearchTerm("");
    setMobileMenuOpen(false);
    setMobileAccountOpen(false);
    setIsDropdownOpen(false);
    setAccountMenuOpen(false);
    setSelectedCategory(DEFAULT_LABEL);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
      setMobileMenuOpen(false);
      setMobileAccountOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const path = location.pathname || "/";
    if (path === "/") {
      setSelectedCategory(DEFAULT_LABEL);
      return;
    }
    if (path.startsWith("/type/")) {
      const key = path.split("/").pop() || "";
      const map: Record<string, string> = {
        MANHWA: "MANHWA",
        MANGA: "MANGA",
        MANHUA: "MANHUA",
      };
      setSelectedCategory(map[key] ?? DEFAULT_LABEL);
      return;
    }
    setSelectedCategory(DEFAULT_LABEL);
  }, [location.pathname]);

const readingListIdle =
  "bg-gradient-to-r from-blue-50 to-sky-100 text-blue-700 ring-1 ring-inset ring-blue-200 hover:from-blue-100 hover:to-sky-100 dark:from-[#221c18] dark:to-[#171310] dark:text-blue-300 dark:ring-[#342b24] dark:hover:from-[#2a221d] dark:hover:to-[#1d1713]";
  const readingListActive =
    selectedNavClasses;
  const adminLinkIdle =
    "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:from-[#221c18] dark:to-[#171310] dark:bg-[linear-gradient(145deg,_rgba(32,26,22,0.95),_rgba(22,18,15,0.95))] dark:text-amber-200 dark:ring-[#342b24] dark:hover:bg-[#2a221d]";
  const adminLinkActive =
    selectedNavClasses;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-[#322922]/80 dark:bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.08),_transparent_24%),linear-gradient(180deg,_rgba(24,19,16,0.97),_rgba(18,14,12,0.97))]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <button
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 sm:hidden"
            onClick={() =>
              setMobileMenuOpen((prev) => {
                const next = !prev;
                if (next) {
                  setMobileAccountOpen(false);
                }
                return next;
              })
            }
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <Bars3Icon className="h-5 w-5" />
            )}
          </button>

          <a
            href="/"
            onClick={handleHomeClick}
            className="flex items-center gap-3 rounded-full pr-1 transition hover:opacity-90"
            aria-label="Go to homepage"
          >
            <img
              src={myHomeLogo}
              alt="Toon Ranks Logo"
              className="h-11 w-11 object-contain"
            />
          </a>

          <nav className="hidden items-center gap-2 sm:flex">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#241d19] dark:hover:text-white"
              >
                {selectedCategory}
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] dark-theme-card">
                  {[
                    { to: "/", label: "ALL" },
                    { to: "/type/MANHWA", label: "MANHWA" },
                    { to: "/type/MANGA", label: "MANGA" },
                    { to: "/type/MANHUA", label: "MANHUA" },
                  ].map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setSelectedCategory(item.label);
                      }}
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#241d19] dark:hover:text-white"
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <NavLink to="/forum" className={desktopNavLink}>
              Forum
            </NavLink>
          </nav>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              className={`h-10 rounded-full border border-slate-200 bg-slate-50 pl-4 pr-11 text-sm text-slate-700 shadow-sm outline-none transition-all duration-300 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200 dark-theme-field dark:focus:bg-[#181310] dark:focus:ring-[#2a221c] ${
                showSearch
                  ? "w-56 opacity-100"
                  : "pointer-events-none w-0 border-transparent px-0 opacity-0"
              }`}
              placeholder="Search titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type={showSearch ? "submit" : "button"}
              onClick={!showSearch ? handleSearchClick : undefined}
              className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#241d19] dark:hover:text-white"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark-theme-card dark:text-slate-300 dark:hover:bg-[#241d19] dark:hover:text-white"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>

          {user ? (
            <>
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 dark-theme-chip dark:text-slate-200"
                >
                  {user.username}
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] dark-theme-card">
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Account
                    </div>
                    <div className="flex flex-col gap-1">
                      {isAdmin && (
                        <NavLink
                          to="/pending-titles"
                          onClick={() => setAccountMenuOpen(false)}
                          className={({ isActive }) =>
                            [
                              "inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition shadow-sm",
                              isActive ? adminLinkActive : adminLinkIdle,
                            ].join(" ")
                          }
                        >
                          Review Titles
                        </NavLink>
                      )}
                      {canSubmit && (
                        <NavLink
                          to="/my-submissions"
                          onClick={() => setAccountMenuOpen(false)}
                          className={({ isActive }) =>
                            [
                              "inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition shadow-sm",
                              isActive ? readingListActive : readingListIdle,
                            ].join(" ")
                          }
                        >
                          My Submissions
                        </NavLink>
                      )}
                      <NavLink
                        to="/my-lists"
                        onClick={() => setAccountMenuOpen(false)}
                        className={({ isActive }) =>
                          [
                            "inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition shadow-sm",
                            isActive ? readingListActive : readingListIdle,
                          ].join(" ")
                        }
                      >
                        <BookmarkIcon className="h-4 w-4" />
                        My Lists
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="rounded-2xl px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className={authLink}>
                Login
              </NavLink>
              <NavLink to="/signup" className={authLink}>
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.45)] dark:border-[#322922]/80 dark:bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.08),_transparent_24%),linear-gradient(180deg,_rgba(24,19,16,0.98),_rgba(18,14,12,0.98))] sm:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-sm dark-theme-card">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Browse
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: "/", label: "All" },
                  { to: "/type/MANHWA", label: "Manhwa" },
                  { to: "/type/MANGA", label: "Manga" },
                  { to: "/type/MANHUA", label: "Manhua" },
                  { to: "/forum", label: "Forum" },
                ].map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      [
                        "rounded-2xl px-4 py-3 text-sm font-semibold transition",
                        isActive
                          ? selectedNavClasses
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-[#181310] dark:text-slate-200 dark:hover:bg-[#241d19]",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3 dark-theme-card">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Search
              </div>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark-theme-field dark:focus:ring-[#2a221c]"
                  placeholder="Search titles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  Go
                </button>
              </form>
            </div>

            {user ? (
              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-sm dark-theme-card">
                <button
                  type="button"
                  onClick={() => setMobileAccountOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Account
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {user.username}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTheme();
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark-theme-card dark:text-slate-200 dark:hover:bg-[#241d19]"
                    >
                      {theme === "dark" ? (
                        <SunIcon className="h-4 w-4" />
                      ) : (
                        <MoonIcon className="h-4 w-4" />
                      )}
                      {theme === "dark" ? "Light" : "Dark"}
                    </button>
                    <ChevronDownIcon
                      className={`h-5 w-5 text-slate-500 transition-transform dark:text-slate-300 ${
                        mobileAccountOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {mobileAccountOpen && (
                  <div className="mt-3 flex flex-col gap-2">
                    {isAdmin && (
                      <NavLink
                        to="/pending-titles"
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          [
                            "inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition shadow-sm",
                            isActive ? adminLinkActive : adminLinkIdle,
                          ].join(" ")
                        }
                      >
                        Review Titles
                      </NavLink>
                    )}
                    {canSubmit && (
                      <NavLink
                        to="/my-submissions"
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          [
                            "inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition shadow-sm",
                            isActive ? readingListActive : readingListIdle,
                          ].join(" ")
                        }
                      >
                        My Submissions
                      </NavLink>
                    )}
                    <NavLink
                      to="/my-lists"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        [
                          "inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition shadow-sm",
                          isActive ? readingListActive : readingListIdle,
                        ].join(" ")
                      }
                    >
                      <BookmarkIcon className="h-4 w-4" />
                      My Lists
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="rounded-2xl px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-sm dark-theme-card">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Account
                </div>
                <div className="grid grid-cols-2 gap-2">
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:bg-[#181310] dark:text-slate-200 dark:hover:bg-[#241d19]"
                >
                  Sign Up
                </NavLink>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-3 dark-theme-card">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Follow
              </span>
              <SocialLinks variant="header" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
