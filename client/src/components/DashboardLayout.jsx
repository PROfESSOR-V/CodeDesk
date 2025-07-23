import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import Home from "../pages/Home.jsx";

export default function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 min-h-screen bg-gray-50">
        <TopBar />
        <main>
          <Home />
        </main>
      </div>
    </div>
  );
} 