 import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import Home from "../pages/Home.jsx";

// Separate Logout Modal component
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50"
      role="dialog"
      aria-modal="true"
      onClick={onCancel} // close modal if clicked outside
    >
      <div
        className="w-full max-w-sm p-6 bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <h2 className="mb-2 text-lg font-semibold">Confirm Logout</h2>
        <p className="mb-4 text-gray-700">Are you sure you want to log out?</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white transition-colors bg-red-600 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleConfirmLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const handleCancelLogout = () => setShowLogoutModal(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar with animated width */}
      <div
        className={`flex-shrink-0 bg-gray-800 text-white transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-64" : "w-16"}`}
      >
        <Sidebar open={sidebarOpen} onLogoutClick={handleLogoutClick} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 transition-all duration-300 bg-gray-50 dark:bg-gray-900">
        <TopBar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          onLogoutClick={handleLogoutClick}
        />
        <main className="flex-1 p-4 overflow-auto md:p-6">{children || <Home />}</main>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </div>
  );
}
