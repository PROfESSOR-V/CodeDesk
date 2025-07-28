import { FaBell, FaSun, FaBars, FaTimes } from "react-icons/fa";
import { supabase } from "../supabaseClient.js";
import { useNavigate } from "react-router-dom";
// Removed BrandName import and navigate

export default function TopBar({ onToggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <header className="sticky top-0 z-10 h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shadow-sm">
      <button onClick={onToggleSidebar} className="text-gray-600 hover:text-gray-800">
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      <div className="flex items-center ml-auto gap-4">
        <button className="relative mr-4 text-gray-600 hover:text-gray-800">
          <FaBell />
        </button>
        <button className="text-gray-600 hover:text-gray-800" title="Dark mode coming soon" disabled>
          <FaSun />
        </button>
        <button onClick={logout} className="text-gray-600 hover:text-gray-800" title="Logout">
          <FaTimes />
        </button>
      </div>
    </header>
  );
} 