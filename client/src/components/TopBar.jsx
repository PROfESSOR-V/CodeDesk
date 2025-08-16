import { useState, useEffect } from "react";
import { FaBell, FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";
import { supabase } from "../supabaseClient.js";
import { useNavigate } from "react-router-dom";

export default function TopBar({ onToggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();
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

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-700 flex items-center justify-between px-4 md:px-6 shadow-sm transition-colors">
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className="text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white transition-colors"
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Right Icons */}
      <div className="flex items-center ml-auto gap-4">
        <button className="relative text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white transition-colors">
          <FaBell />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white transition-colors"
          title="Logout"
        >
          <FaTimes />
        </button>
      </div>
    </header>
  );
}
