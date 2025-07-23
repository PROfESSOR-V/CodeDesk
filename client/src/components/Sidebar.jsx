import { FaHome, FaBriefcase, FaBook, FaRegBookmark, FaChartPie, FaClipboardList, FaPenFancy, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import BrandName from "./BrandName.jsx";
import { useNavigate } from "react-router-dom";

const menu = [
  { label: "Home", icon: <FaHome /> },
  { section: "Profile Tracker" },
  { label: "Portfolio", icon: <FaBriefcase /> },
  { section: "Question Tracker" },
  { label: "My Workspace", icon: <FaClipboardList /> },
  { label: "Explore Sheets", icon: <FaBook /> },
  { label: "My Sheets", icon: <FaRegBookmark /> },
  { label: "Notes", icon: <FaPenFancy /> },
  { section: "Event Tracker" },
  { label: "Contests", icon: <FaChartPie /> },
  { section: "Community" },
  { label: "Leaderboard", icon: <FaChartPie /> },
  { section: "Feedback" },
  { label: "Form", icon: <FaPenFancy /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    // future: clear auth tokens here
    navigate("/");
  };

  return (
    <aside className="w-64 bg-white border-r h-screen fixed overflow-y-auto hidden md:block">
      <div className="p-4 text-2xl font-bold flex items-center gap-2">
        {/* Placeholder logo */}
        🦉 <BrandName />
      </div>

      <nav className="mt-6 px-2 text-sm">
        {menu.map((item, idx) =>
          item.section ? (
            <p
              key={idx}
              className="mt-3 mb-1 px-2 text-gray-500 uppercase tracking-wider text-xs"
            >
              {item.section}
            </p>
          ) : (
            <button
              key={idx}
              className="w-full flex items-center gap-1.5 py-1 px-3 rounded hover:bg-gray-100 text-gray-700"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          )
        )}
      </nav>

      <div className="absolute bottom-0 left-0 w-full p-3 border-t">
        <button className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100 text-gray-700 text-sm">
          <FaUserCircle className="text-base" /> Edit Profile
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100 text-gray-700 text-sm mt-1">
          <FaSignOutAlt className="text-base" /> Log Out
        </button>
      </div>
    </aside>
  );
} 