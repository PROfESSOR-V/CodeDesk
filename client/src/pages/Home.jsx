import { useEffect, useState } from "react";
import anime from "animejs";
import { supabase } from "../supabaseClient";
import DashboardCard from "../components/DashboardCard.jsx";
import ContributionHeatmap from "../components/ContributionHeatmap";
import CalendarCard from "../components/CalendarCard.jsx";

export default function Home() {
  // -------------------------------
  // 1. Animate Dashboard Cards
  // -------------------------------
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

  // -------------------------------
  // 2. Fetch unified activity for Contribution Heatmap
  // -------------------------------
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

  // -------------------------------
  // 3. Dashboard stats (hardcoded for now)
  // -------------------------------
  const dashboardStats = [
    { title: "Total Questions", value: 0 },
    { title: "Completed Questions", value: 0 },
    { title: "Starred Questions", value: 0 },
  ];

  // -------------------------------
  // 4. JSX
  // -------------------------------
  return (
    <div className="p-6 space-y-8">
      
      {/* Dashboard Stats Cards */}
      <div className="flex flex-wrap gap-4">
        {dashboardStats.map((stat) => (
          <DashboardCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent Sheets + Contribution Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent / Custom Sheets Section */}
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

        {/* Contribution Heatmap */}
        <ContributionHeatmap activity={activity} />
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <CalendarCard />
      </div>
    </div>
  );
}
