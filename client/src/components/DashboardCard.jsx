export default function DashboardCard({ title, value }) {
  return (
    <div className="dashboard-card flex-1 min-w-[160px] bg-white p-6 rounded-lg shadow-sm border">
      <p className="text-gray-500 text-sm mb-2">{title}</p>
      <h3 className="text-3xl font-semibold">{value}</h3>
    </div>
  );
} 