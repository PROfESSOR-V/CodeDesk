import { FaBell, FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";
import { supabase } from "../supabaseClient.js";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

export default function TopBar({ onToggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header
      className={`sticky top-0 z-10 h-16 border-b flex items-center justify-between px-4 md:px-6 shadow-sm
        ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}
    >
      <button
        onClick={onToggleSidebar}
        className={`hover:scale-105 transition-transform duration-200 ${
          darkMode ? "text-gray-200 hover:text-white" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div className="flex items-center ml-auto gap-4">
        <button
          className={`relative hover:scale-105 transition-transform duration-200 ${
            darkMode ? "text-gray-200 hover:text-white" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <FaBell />
        </button>

        <button
          onClick={toggleDarkMode}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-transform duration-300
            ${darkMode ? "bg-gray-700 text-yellow-300 hover:scale-110" : "bg-gray-200 text-gray-800 hover:scale-110"}`}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        <button
          onClick={logout}
          className={`hover:scale-105 transition-transform duration-200 ${
            darkMode ? "text-gray-200 hover:text-white" : "text-gray-600 hover:text-gray-800"
          }`}
          title="Logout"
        >
          <FaTimes />
        </button>
      </div>
    </header>
  );
}
