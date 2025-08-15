import { useNavigate } from "react-router-dom";
import BrandName from "./BrandName.jsx";
import { useTheme } from "../context/ThemeContext.jsx"; // import theme hook
import { FaSun, FaMoon } from "react-icons/fa";

export default function LandingNavbar() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <nav
      className={`flex items-center justify-between py-4 px-6 sticky top-0 z-20 shadow-sm transition-colors duration-300
        ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}
    >
      <div onClick={() => navigate("/")} className="cursor-pointer">
        <BrandName className="text-2xl font-bold" />
      </div>

      <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
        <li>
          <button onClick={() => navigate('/signup')} className={`hover:text-[#e67829] ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Leaderboard</button>
        </li>
        <li>
          <button onClick={() => navigate('/signup')} className={`hover:text-[#e67829] ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Question Tracker</button>
        </li>
        <li>
          <button onClick={() => navigate('/signup')} className={`hover:text-[#e67829] ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Event Tracker</button>
        </li>
        <li>
          <button onClick={() => navigate('/signup')} className={`hover:text-[#e67829] ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Profile Tracker</button>
        </li>
      </ul>

      <div className="flex items-center gap-3">
        {/* Dark/Light toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-transform duration-300 hover:scale-110
            bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-300"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        <button
          onClick={() => navigate('/signup')}
          className="ml-2 bg-[#e67829] text-white px-4 py-2 rounded shadow hover:bg-[#e67829]/90 text-sm"
        >
          Login / Sign Up
        </button>
      </div>
    </nav>
  );
}
