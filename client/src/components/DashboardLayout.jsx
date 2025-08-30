import React from "react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import Home from "../pages/Home.jsx";
<<<<<<< HEAD
=======

>>>>>>> befaefd8a6f63567e230e9bfa822dd9e60e4ad49
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
<<<<<<< HEAD
  const handleLogoutClick = () => {
    setShowConfirmModal(true);
  };
=======

   const handleLogoutClick = () => {
    setShowConfirmModal(true);
  };

>>>>>>> befaefd8a6f63567e230e9bfa822dd9e60e4ad49
  const handleConfirmLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    navigate("/login");
    setShowConfirmModal(false);
  };
<<<<<<< HEAD
=======

>>>>>>> befaefd8a6f63567e230e9bfa822dd9e60e4ad49
  const handleCancelLogout = () => {
    setShowConfirmModal(false);
  };

<<<<<<< HEAD
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onLogoutClick={handleLogoutClick} />
=======

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onLogoutClick={handleLogoutClick} />

>>>>>>> befaefd8a6f63567e230e9bfa822dd9e60e4ad49
      {/* Main content area */}
      <div
        className={`flex-1 min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-all duration-300 ${
          sidebarOpen ? "ml-0 md:ml-64" : "ml-0 md:ml-16"
        }`}
      >
        <TopBar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} onLogoutClick={handleLogoutClick} />
<<<<<<< HEAD
        <main className="flex-1 p-4 md:p-8">
          {typeof children !== "undefined" ? children : <Home />}
        </main>
      </div>
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Confirm Logout</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
=======
        <main className="flex-1 p-4 md:p-6">
          {typeof children !== "undefined" ? children : <Home />}
        </main>

      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">Confirm Logout</h2>
            <p className="text-gray-700 mb-4">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
>>>>>>> befaefd8a6f63567e230e9bfa822dd9e60e4ad49
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
<<<<<<< HEAD
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors font-semibold"
=======
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
>>>>>>> befaefd8a6f63567e230e9bfa822dd9e60e4ad49
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> befaefd8a6f63567e230e9bfa822dd9e60e4ad49
