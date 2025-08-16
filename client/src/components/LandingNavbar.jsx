import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import BrandName from "./BrandName.jsx";

export default function LandingNavbar() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <nav className="flex items-center justify-between py-4 px-6 bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20">
      {/* Logo / Brand */}
    <div onClick={() => navigate("/")}>
  <BrandName className="text-3xl font-bold cursor-pointer text-gray-900 dark:text-white" />
</div>

      {/* Menu */}
      <ul className="hidden md:flex items-center gap-6 text-lg font-medium text-gray-700 dark:text-gray-300">
        <li>
          <button onClick={() => navigate('/signup')} className="hover:text-[#e67829]">Leaderboard</button>
        </li>
        <li>
          <button onClick={() => navigate('/signup')} className="hover:text-[#e67829]">Question Tracker</button>
        </li>
        <li>
          <button onClick={() => navigate('/signup')} className="hover:text-[#e67829]">Event Tracker</button>
        </li>
        <li>
          <button onClick={() => navigate('/signup')} className="hover:text-[#e67829]">Profile Tracker</button>
        </li>
      </ul>

      {/* Right side buttons */}
      <div className="flex items-center gap-3 ml-auto md:ml-0">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {/* Login / Signup */}
        <button
          onClick={() => navigate('/signup')}
          className="bg-[#e67829] text-white px-4 py-2 rounded shadow hover:bg-[#e67829]/90 text-lg"
        >
          Login / Sign Up
        </button>
      </div>
    </nav>
  );
}
