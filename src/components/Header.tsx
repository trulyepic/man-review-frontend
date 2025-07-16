import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../login/UserContext";
import { useState } from "react";
import { useSearch } from "./SearchContext";
import myLogo from "../images/logo/myLogo.png";
import myHomeLogo from "../images/logo/myHomeLogo.png";
import SocialLinks from "./SocialLinks";

const Header = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { searchTerm, setSearchTerm } = useSearch();

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

  return (
    <header className="border-b shadow-md">
      <div className="flex flex-wrap justify-between items-center px-6 md:px-10 max-w-7xl mx-auto py-4">
        {/* Mobile menu button - inline, visible only on mobile */}
        <button
          className="lg:hidden mr-2"
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
          <div className="hidden lg:flex items-center space-x-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "text-blue-400" : "hover:text-blue-300"
              }
            >
              All
            </NavLink>
            <NavLink
              to="/type/MANHWA"
              className={({ isActive }) =>
                isActive ? "text-blue-400" : "hover:text-blue-300"
              }
            >
              Manhwa
            </NavLink>
            <NavLink
              to="/type/MANGA"
              className={({ isActive }) =>
                isActive ? "text-blue-400" : "hover:text-blue-300"
              }
            >
              Manga
            </NavLink>
            <NavLink
              to="/type/MANHUA"
              className={({ isActive }) =>
                isActive ? "text-blue-400" : "hover:text-blue-300"
              }
            >
              Manhua
            </NavLink>
            <SocialLinks variant="header" />
            <a
              href="https://ex-hibt.com/collection-homepage/59"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-500"
              title="Visit img collections"
            >
              <img
                src={myLogo}
                alt="img collections"
                className="w-5 h-5 object-contain "
              />
              Ex-hibt Collections
            </a>
          </div>
        </div>

        {/* Right side (desktop only) */}
        <div className="hidden lg:flex items-center space-x-4">
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
        <div className="lg:hidden flex flex-col space-y-3 px-6 pb-4 text-sm font-medium">
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
              <span className="bg-gray-200 px-3 py-1 rounded-full font-bold text-black text-sm">
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
