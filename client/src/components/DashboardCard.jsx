export default function DashboardCard({ title, value }) {
  return (
    <div className="dashboard-card flex-1 min-w-[180px] max-w-xs bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors hover:scale-105 hover:shadow-xl duration-200 ease-in-out">
      <p className="text-gray-500 dark:text-gray-400 text-base mb-2 font-medium tracking-wide">{title}</p>
      <h3 className="text-4xl font-bold text-blue-700 dark:text-purple-300">{value}</h3>
    </div>
  );
}