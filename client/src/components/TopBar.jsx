import { useState, useEffect } from "react";
import { FaBell, FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";

export default function TopBar({ onToggleSidebar, isSidebarOpen, onLogoutClick }) {

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme based on localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      document.documentElement.classList.toggle("dark", newMode);
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  return (
    <header className="sticky top-0 z-10 h-16 bg-gradient-to-r from-orange-100 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b dark:border-gray-700 flex items-center justify-between px-4 md:px-6 shadow-lg transition-colors">
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className="text-gray-600 dark:text-orange-300 hover:text-[#e67829] dark:hover:text-orange-400 transition-colors text-xl rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Right Icons */}
      <div className="flex items-center ml-auto gap-4">
        <button className="relative text-gray-600 dark:text-orange-300 hover:text-[#e67829] dark:hover:text-orange-400 transition-colors text-xl rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-300">
          <FaBell />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="text-gray-600 dark:text-orange-300 hover:text-[#e67829] dark:hover:text-orange-400 transition-colors text-xl rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* Logout */}
        <button
          onClick={onLogoutClick}
          className="text-gray-600 dark:text-orange-300 hover:text-[#e67829] dark:hover:text-orange-400 transition-colors text-xl rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
          title="Logout"
        >
          <FaTimes />
        </button>
      </div>
    </header>
  );
}