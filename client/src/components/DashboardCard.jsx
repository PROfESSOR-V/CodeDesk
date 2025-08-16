export default function DashboardCard({ title, value }) {
  return (
    <div className="dashboard-card flex-1 min-w-[160px] bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{title}</p>
      <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</h3>
    </div>
  );
}
