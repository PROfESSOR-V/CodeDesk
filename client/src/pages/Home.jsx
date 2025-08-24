import { useEffect, useState } from "react";
import anime from "animejs";
import { supabase } from "../supabaseClient";
import DashboardCard from "../components/DashboardCard.jsx";
import ContributionHeatmap from "../components/ContributionHeatmap";

export default function Home() {
  useEffect(() => {
    anime({
      targets: ".dashboard-card",
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 800,
      easing: "easeOutQuart",
      delay: anime.stagger(100),
    });
  }, []);

  const [activity, setActivity] = useState([]);
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/users/portfolio`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setActivity(data.unifiedActivity || []);
        } else {
          console.error("Failed to fetch activity", res.status);
        }
      } catch (err) {
        console.error("Error fetching activity", err);
      }
    };
    fetchActivity();
  }, []);

  const dashboardStats = [
    { title: "Total Questions", value: 0 },
    { title: "Completed Questions", value: 0 },
    { title: "Starred Questions", value: 0 },
  ];

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Dashboard Stats Cards */}
      <div className="flex flex-wrap gap-6 justify-center">
        {dashboardStats.map((stat) => (
          <DashboardCard key={stat.title} {...stat} />
        ))}
      </div>
      {/* Recent Sheets + Contribution Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent / Custom Sheets Section */}
        <div className="col-span-2 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 border-b pb-3 text-base">
            <button className="font-semibold text-blue-600 border-b-2 border-blue-600 pb-1 focus:outline-none">Recent</button>
            <button className="text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">Custom Sheets</button>
          </div>
          <ul className="divide-y mt-6 text-base">
            <li className="py-4 flex items-center justify-between">
              <span className="font-medium">Love Babbar Sheet</span>
              <span className="text-gray-400 text-xs bg-blue-50 px-2 py-1 rounded-full">Viewed Today</span>
            </li>
            <li className="py-4 flex items-center justify-between">
              <span className="font-medium">Striver SDE Sheet</span>
              <span className="text-gray-400 text-xs bg-purple-50 px-2 py-1 rounded-full">Viewed Today</span>
            </li>
          </ul>
        </div>
        {/* Contribution Heatmap */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <ContributionHeatmap activity={activity} />
        </div>
      </div>
    </div>
  );
}