/*import { useNavigate } from "react-router-dom";
import BrandName from "./BrandName.jsx";

export default function LandingNavbar() {
  const navigate = useNavigate();
  return (
    <nav className="flex items-center justify-between py-4 px-6 bg-white shadow-sm sticky top-0 z-20">
      <div onClick={() => navigate("/")}>
        <BrandName className="text-2xl font-bold cursor-pointer" />
      </div>
      <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
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
      <button
        onClick={() => navigate('/signup')}
        className="ml-auto md:ml-0 bg-[#e67829] text-white px-4 py-2 rounded shadow hover:bg-[#e67829]/90 text-sm"
      >
        Login / Sign Up
      </button>
    </nav>
  );
} */
import { useNavigate } from "react-router-dom";
import BrandName from "./BrandName.jsx";

export default function LandingNavbar() {
  const navigate = useNavigate();
  return (
    <nav className="flex items-center justify-between py-4 px-6 bg-white shadow-sm sticky top-0 z-20">
      <div onClick={() => navigate("/")}>
        <BrandName className="text-2xl font-bold cursor-pointer" />
      </div>
      <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
        <li>
          {/* Change the route to a dedicated leaderboard page */}
          <button onClick={() => navigate('/leaderboard')} className="hover:text-[#e67829]">Leaderboard</button>
        </li>
        <li>
          {/* Change the route to a dedicated question tracker page */}
          <button onClick={() => navigate('/question-tracker')} className="hover:text-[#e67829]">Question Tracker</button>
        </li>
        <li>
          {/* Change the route to a dedicated event tracker page */}
          <button onClick={() => navigate('/event-tracker')} className="hover:text-[#e67829]">Event Tracker</button>
        </li>
        <li>
          {/* Change the route to a dedicated profile page */}
          <button onClick={() => navigate('/profile')} className="hover:text-[#e67829]">Profile Tracker</button>
        </li>
      </ul>
      <button
        onClick={() => navigate('/signup')}
        className="ml-auto md:ml-0 bg-[#e67829] text-white px-4 py-2 rounded shadow hover:bg-[#e67829]/90 text-sm"
      >
        Login / Sign Up
      </button>
    </nav>
  );
}