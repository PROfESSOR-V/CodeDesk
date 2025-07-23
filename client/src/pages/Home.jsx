import DashboardCard from "../components/DashboardCard.jsx";

export default function Home() {
  const dashboardStats = [
    { title: "Total Questions", value: 0 },
    { title: "Completed Questions", value: 0 },
    { title: "Starred Questions", value: 0 },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        {dashboardStats.map((stat) => (
          <DashboardCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent & Calendar grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent */}
        <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-6 border-b pb-3 text-sm">
            <button className="font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
              Recent
            </button>
            <button className="text-gray-500">Custom Sheets</button>
          </div>
          <ul className="divide-y mt-4 text-sm">
            <li className="py-3 flex items-center justify-between">
              <span>Love Babbar Sheet</span>
              <span className="text-gray-400 text-xs">Viewed Today</span>
            </li>
            <li className="py-3 flex items-center justify-between">
              <span>Striver SDE Sheet</span>
              <span className="text-gray-400 text-xs">Viewed Today</span>
            </li>
          </ul>
        </div>
        {/* Calendar placeholder */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="font-medium mb-4">Calendar</p>
          <p className="text-gray-400 text-sm">Calendar integration coming soon</p>
        </div>
      </div>
    </div>
  );
} 