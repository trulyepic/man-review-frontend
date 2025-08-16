import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSearch } from "./SearchContext";
import myLogo from "../images/logo/myLogo.png";
import myHomeLogo from "../images/logo/myHomeLogo.png";
import SocialLinks from "./SocialLinks";
import { useEffect, useRef } from "react";
import { useUser } from "../login/useUser";
import { BookmarkIcon } from "lucide-react";

const Header = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { searchTerm, setSearchTerm } = useSearch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Categories");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const handleSearchClick = () => {
    setShowSearch((prev) => !prev);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
      setMobileMenuOpen(false);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
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

  const pillLink =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold " +
    "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 ring-1 ring-blue-200 " +
    "hover:from-blue-100 hover:to-blue-200 hover:ring-blue-300 " +
    "transition-colors shadow-sm";

  const pillLinkActive =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold " +
    "bg-blue-600 text-white ring-1 ring-blue-600 shadow";

  return (
    <header className="border-b shadow-md">
      <div className="flex flex-wrap justify-between items-center px-6 md:px-10 max-w-7xl mx-auto py-4">
        {/* Mobile menu button - inline, visible only on mobile */}
        <button
          className="sm:hidden mr-2"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6 text-gray-700" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          )}
        </button>

        {/* Left side */}
        <div className="flex items-center space-x-6 text-lg font-semibold min-w-0">
          {/* <NavLink to="/" className="text-blue-400 text-xl font-bold md:-ml-12">
            Toon Ranks
          </NavLink> */}
          <NavLink to="/" className="flex items-center md:-ml-13">
            <img
              src={myHomeLogo}
              alt="Toon Ranks Logo"
              // className="w-8 h-8 md:w-10 md:h-10 object-contain"
              className="w-12 h-12 object-contain"
            />
          </NavLink>

          {/* Desktop nav only */}
          <div className="hidden sm:flex items-center gap-6 text-gray-700">
            {/* Dropdown for Categories */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="hover:text-blue-500 font-medium focus:outline-none"
              >
                {selectedCategory || "Categories"} ▾
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 bg-white border rounded shadow-md w-40 z-50">
                  <div className="flex flex-col">
                    <NavLink
                      to="/"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setSelectedCategory("All");
                      }}
                      className="block px-4 py-2 hover:bg-blue-50"
                    >
                      All
                    </NavLink>
                    <NavLink
                      to="/type/MANHWA"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setSelectedCategory("Manhwa");
                      }}
                      className="block px-4 py-2 hover:bg-blue-50"
                    >
                      Manhwa
                    </NavLink>
                    <NavLink
                      to="/type/MANGA"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setSelectedCategory("Manga");
                      }}
                      className="block px-4 py-2 hover:bg-blue-50"
                    >
                      Manga
                    </NavLink>
                    <NavLink
                      to="/type/MANHUA"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setSelectedCategory("Manhua");
                      }}
                      className="block px-4 py-2 hover:bg-blue-50"
                    >
                      Manhua
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/how-rankings-work"
              className="hover:text-blue-500 font-medium"
            >
              How Rankings Work
            </NavLink>

             <NavLink
              to="/issues"
              className="hover:text-blue-500 font-medium"
            >
             Report
            </NavLink>

            {/* Spacer */}
            {/* <div className="flex-1" /> */}

            {/* Socials and Ex-hibt Link */}
            <div className="flex items-center gap-4">
              {/* <SocialLinks variant="header" /> */}
              <a
                href="https://ex-hibt.com/collection-homepage/59"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm hover:text-blue-500"
                title="Visit img collections"
              >
                <img
                  src={myLogo}
                  alt="img collections"
                  className="w-5 h-5 object-contain"
                />
                Ex-hibt
              </a>
            </div>
          </div>
        </div>

        {/* Right side (desktop only) */}
        <div className="hidden sm:flex items-center space-x-4">
          <form onSubmit={handleSearchSubmit} className="relative w-40 md:w-48">
            <input
              type="text"
              className={`transition-all duration-300 px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none w-full ${
                showSearch ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon
              className="w-6 h-6 text-gray-700 cursor-pointer absolute right-0 top-1/2 -translate-y-1/2"
              onClick={handleSearchClick}
            />
          </form>

          {user ? (
            <>
              <NavLink
                to="/my-lists"
                className={({ isActive }) =>
                  isActive ? pillLinkActive : pillLink
                }
              >
                <BookmarkIcon className="w-4 h-4" />
                My Lists
              </NavLink>
              <span className="bg-gray-200 px-3 py-1 rounded-full font-bold text-black text-sm">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-400 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-sm font-bold text-gray-600 hover:underline"
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="text-sm font-bold text-gray-600 hover:underline"
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden flex flex-col space-y-3 px-6 pb-4 text-sm font-medium">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-800 hover:text-blue-400 "
          >
            All
          </NavLink>
          <NavLink
            to="/type/MANHWA"
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-800 hover:text-blue-400"
          >
            Manhwa
          </NavLink>
          <NavLink
            to="/type/MANGA"
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-800 hover:text-blue-400"
          >
            Manga
          </NavLink>
          <NavLink
            to="/type/MANHUA"
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-800 hover:text-blue-400"
          >
            Manhua
          </NavLink>

          <NavLink
            to="/issues"
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-800 hover:text-blue-400"
          >
            Report an Issue
          </NavLink>

          <NavLink
            to="/how-rankings-work"
            className={({ isActive }) =>
              isActive ? "text-blue-400" : "hover:text-blue-300"
            }
          >
            How Rankings Work
          </NavLink>

          <SocialLinks variant="header" />

          <a
            href="https://ex-hibt.com/collection-homepage/59"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-gray-800 hover:text-blue-400"
          >
            <img
              src={myLogo}
              alt="img collections"
              className="w-5 h-5 object-contain"
            />
            Ex-hibt Collections
          </a>

          {/* Search form for mobile */}

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              className="w-full border border-gray-300 px-2 py-1 rounded text-sm"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="text-blue-500 font-semibold">
              Go
            </button>
          </form>

          {user ? (
            <>
              <NavLink
                to="/my-lists"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  (isActive ? pillLinkActive : pillLink) + " w-max"
                }
              >
                <BookmarkIcon className="w-4 h-4" />
                My Lists
              </NavLink>
              <span className="bg-gray-200 px-3 py-1 w-max rounded-full font-bold text-black text-sm">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:underline"
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:underline"
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
