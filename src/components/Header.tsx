import {
  Bars3Icon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { useSearch } from "./SearchContext";
import { useUser } from "../login/useUser";
import SocialLinks from "./SocialLinks";
import myHomeLogo from "../images/logo/myHomeLogo.png";

const DEFAULT_LABEL = "ALL";

const desktopNavLink = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-3 py-2 text-sm font-semibold tracking-wide transition",
    isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

const authLink = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-3 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

const Header = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchTerm, setSearchTerm } = useSearch();

  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(DEFAULT_LABEL);

  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setIsDropdownOpen(false);
    setSelectedCategory(DEFAULT_LABEL);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
      setMobileMenuOpen(false);
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

  const readingListLink =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition shadow-sm";
  const readingListIdle =
    "bg-gradient-to-r from-blue-50 to-sky-100 text-blue-700 ring-1 ring-inset ring-blue-200 hover:from-blue-100 hover:to-sky-100";
  const readingListActive =
    "bg-slate-900 text-white ring-1 ring-inset ring-slate-900";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <button
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 sm:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
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
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {selectedCategory}
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)]">
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
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
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
              className={`h-10 rounded-full border border-slate-200 bg-slate-50 pl-4 pr-11 text-sm text-slate-700 shadow-sm outline-none transition-all duration-300 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200 ${
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
              className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>

          {user ? (
            <>
              <NavLink
                to="/my-lists"
                className={({ isActive }) =>
                  [
                    readingListLink,
                    isActive ? readingListActive : readingListIdle,
                  ].join(" ")
                }
              >
                <BookmarkIcon className="h-4 w-4" />
                My Lists
              </NavLink>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full px-3 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                Logout
              </button>
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
        <div className="border-t border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.45)] sm:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {[
              { to: "/", label: "ALL" },
              { to: "/type/MANHWA", label: "MANHWA" },
              { to: "/type/MANGA", label: "MANGA" },
              { to: "/type/MANHUA", label: "MANHUA" },
              { to: "/forum", label: "FORUM" },
            ].map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {item.label}
              </NavLink>
            ))}

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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

            <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Follow
              </span>
              <SocialLinks variant="header" />
            </div>

            {user ? (
              <div className="flex flex-col gap-2">
                <NavLink
                  to="/my-lists"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      "inline-flex w-max items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition shadow-sm",
                      isActive ? readingListActive : readingListIdle,
                    ].join(" ")
                  }
                >
                  <BookmarkIcon className="h-4 w-4" />
                  My Lists
                </NavLink>
                <span className="inline-flex w-max items-center rounded-full bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="w-max rounded-full px-3 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={authLink}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={authLink}
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
