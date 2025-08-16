import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import Home from "../pages/Home.jsx";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx"; // import theme context

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode } = useTheme(); // get darkMode state

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className={`flex transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800"}`}>
      <Sidebar open={sidebarOpen} />
      <div
        className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarOpen ? "ml-0 md:ml-64" : "ml-0 md:ml-16"
        }`}
      >
        <TopBar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
        <main className="p-4">
          {typeof children !== "undefined" ? children : <Home />}
        </main>
      </div>
    </div>
  );
}
