import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import MyWorkspace from "./pages/MyWorkspace.jsx"; // 1. Import the new page component

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<DashboardLayout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/workspace" element={<MyWorkspace />} /> {/* 2. Add the route for the new page */}
      </Routes>
    </Router>
  );
}
