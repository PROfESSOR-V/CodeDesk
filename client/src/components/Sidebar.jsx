import { FaHome, FaBriefcase, FaBook, FaRegBookmark, FaChartPie, FaClipboardList, FaPenFancy, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import BrandName from "./BrandName.jsx";
import { useNavigate, useLocation } from "react-router-dom";

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

export default function Sidebar({ open = true, onLogoutClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  /* derive active label based on pathname */
  const path = location.pathname;
  const activeLabel = (() => {
    if (path.startsWith('/dashboard')) return 'Home';
    if (path.startsWith('/portfolio')) return 'Portfolio';
    if (path.startsWith('/workspace')) return 'My Workspace';
    if (path.startsWith('/explore')) return 'Explore Sheets';
    if (path.startsWith('/sheets')) return 'My Sheets';
    if (path.startsWith('/notes')) return 'Notes';
    if (path.startsWith('/contests')) return 'Contests';
    if (path.startsWith('/leaderboard')) return 'Leaderboard';
    if (path.startsWith('/feedback')) return 'Form';
    return '';
  })();


  const widthClass = open ? "w-64" : "w-16";
  const translateClass = "translate-x-0"; // always visible
  const classes = `${widthClass} bg-gradient-to-b from-orange-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r dark:border-gray-700 h-screen fixed overflow-y-auto transform transition-all duration-300 md:block ${translateClass} shadow-xl`;

  const handleMenuClick = (label) => {
    switch (label) {
      case "Home":
        navigate("/dashboard");
        break;
      case "Portfolio":
        navigate("/portfolio");
        break;
      case "My Workspace":
        navigate("/workspace");
        break;
      case "Notes":
        navigate("/notes");
        break;
      case 'Form':
        navigate('/feedback');
        break;
      default:
        break;
    }
  };

  return (
    <aside className={classes}>
      <div className={`p-4 text-2xl font-bold flex items-center ${open ? "gap-2" : "justify-center"} text-gray-900 dark:text-white drop-shadow-lg`}> 
        <span className="rounded-full bg-orange-200 dark:bg-gray-800 p-2 mr-2">🦉</span> {open && <BrandName />}
      </div>

      <nav className="mt-6 px-2 text-sm">
        {menu.map((item, idx) =>
          item.section ? (
            open && (
              <p
                key={idx}
                className="mt-3 mb-1 px-2 text-orange-500 dark:text-orange-300 uppercase tracking-wider text-xs font-semibold"
              >
                {item.section}
              </p>
            )
          ) : (
            <button
              key={idx}
              onClick={() => handleMenuClick(item.label)}
              className={`w-full flex items-center gap-1.5 py-2 px-3 rounded-lg transition-all duration-200 active:bg-orange-100 hover:bg-orange-50 dark:hover:bg-gray-800 shadow-sm ${open ? '' : 'justify-center'} ${activeLabel===item.label ? 'bg-orange-100 dark:bg-orange-900 text-[#e67829] font-bold' : 'text-gray-700 dark:text-gray-200'}`}
            >
              <span className="text-base">{item.icon}</span>
              {open && <span>{item.label}</span>}
            </button>
          )
        )}
      </nav>

      <div className="absolute bottom-0 left-0 w-full p-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-md">
        <button
          onClick={() => navigate("/profile/edit")}
          className={`w-full flex items-center gap-2 py-1.5 ${open ? "px-2 justify-start" : "justify-center"} rounded-lg hover:bg-orange-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium transition-all`}
        >
          <FaUserCircle className="text-base" /> {open && "Edit Profile"}
        </button>
        <button
          onClick={onLogoutClick}
          className={`w-full flex items-center gap-2 py-1.5 ${open ? "px-2 justify-start" : "justify-center"} rounded-lg hover:bg-orange-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium mt-1 transition-all`}
        >
          <FaSignOutAlt className="text-base" /> {open && "Log Out"}
        </button>
      </div>
    </aside>
  );
}