import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import Home from "../pages/Home.jsx";

import { useState } from "react";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} />

      {/* Main content area */}
      <div
        className={`flex-1 min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-all duration-300 ${
          sidebarOpen ? "ml-0 md:ml-64" : "ml-0 md:ml-16"
        }`}
      >
        <TopBar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
        <main className="flex-1 p-4 md:p-6">
          {typeof children !== "undefined" ? children : <Home />}
        </main>
        
      </div>
    </div>
  );
}
