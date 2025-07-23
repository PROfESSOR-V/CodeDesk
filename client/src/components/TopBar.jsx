import { FaBell, FaSun } from "react-icons/fa";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-10 h-16 bg-white border-b flex items-center justify-end px-6 shadow-sm">
      {/* Placeholder for future notifications */}
      <button className="relative mr-4 text-gray-600 hover:text-gray-800">
        <FaBell />
      </button>
      {/* Dark mode toggle placeholder - will be implemented later */}
      <button className="text-gray-600 hover:text-gray-800" title="Dark mode coming soon" disabled>
        <FaSun />
      </button>
    </header>
  );
} 