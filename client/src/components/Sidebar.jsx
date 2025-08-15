import { FaHome, FaBriefcase, FaBook, FaRegBookmark, FaChartPie, FaClipboardList, FaPenFancy, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import BrandName from "./BrandName.jsx";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx"; // import theme hook

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

export default function Sidebar({ open = true }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // get darkMode state

  const handleLogout = () => {
    navigate("/");
  };

  const widthClass = open ? "w-64" : "w-16";
  const translateClass = "translate-x-0"; 
  const classes = `${widthClass} ${darkMode ? "bg-gray-900 text-gray-200 border-gray-700" : "bg-white text-gray-800 border-gray-200"} border-r h-screen fixed overflow-y-auto transform transition-all duration-300 md:block ${translateClass}`;

  const handleMenuClick = (label) => {
    switch(label) {
      case 'Home':
        navigate('/dashboard');
        break;
      case 'Portfolio':
        navigate('/portfolio');
        break;
      default:
        break;
    }
  };

  return (
    <aside className={classes}>
      <div className={`p-4 text-2xl font-bold flex items-center ${open ? 'gap-2' : 'justify-center'}`}>
        🦉 {open && <BrandName />}
      </div>

      <nav className="mt-6 px-2 text-sm">
        {menu.map((item, idx) =>
          item.section ? (
            open && (
              <p
                key={idx}
                className={`${darkMode ? "text-gray-400" : "text-gray-500"} mt-3 mb-1 px-2 uppercase tracking-wider text-xs`}
              >
                {item.section}
              </p>
            )
          ) : (
            <button
              key={idx}
              onClick={() => handleMenuClick(item.label)}
              className={`w-full flex items-center gap-1.5 py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${darkMode ? "text-gray-200" : "text-gray-700"} ${open ? '' : 'justify-center'}`}
            >
              <span className="text-base">{item.icon}</span>
              {open && <span>{item.label}</span>}
            </button>
          )
        )}
      </nav>

      <div className="absolute bottom-0 left-0 w-full p-3 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => navigate('/profile/edit')} 
          className={`w-full flex items-center gap-2 py-1.5 ${open ? 'px-2 justify-start' : 'justify-center'} rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}
        >
          <FaUserCircle className="text-base" /> {open && 'Edit Profile'}
        </button>
        <button 
          onClick={handleLogout} 
          className={`w-full flex items-center gap-2 py-1.5 ${open ? 'px-2 justify-start' : 'justify-center'} rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm mt-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
        >
          <FaSignOutAlt className="text-base" /> {open && 'Log Out'}
        </button>
      </div>
    </aside>
  );
}
