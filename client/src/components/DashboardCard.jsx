import { useTheme } from "../context/ThemeContext.jsx";

export default function DashboardCard({ title, value }) {
  const { darkMode } = useTheme();

  return (
    <div
      className={`dashboard-card flex-1 min-w-[160px] p-6 rounded-lg shadow-sm border transition-colors duration-300
        ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-800 border-gray-200"}`}
    >
      <p className="text-sm mb-2 text-gray-500">{title}</p>
      <h3 className="text-3xl font-semibold">{value}</h3>
    </div>
  );
}
