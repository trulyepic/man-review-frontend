import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../login/UserContext";
import { useState } from "react";
import { useSearch } from "./SearchContext";

const Header = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
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
    }
  };

  return (
    <header className="border-b shadow-md">
      <div className="flex justify-between items-center px-6 md:px-10 max-w-7xl mx-auto py-4">
        {/* Left side */}
        <div className="flex items-center space-x-6 text-lg font-semibold">
          <NavLink to="/" className="text-blue-400 text-xl font-bold -ml-12">
            Toon Ranks
          </NavLink>
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
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearchSubmit} className="relative w-40">
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
    </header>
  );
};

export default Header;
