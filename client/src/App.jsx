import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Landing from "./pages/Landing.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import MyWorkspace from "./pages/MyWorkspace.jsx";
import NotesPage from "./pages/NotesPage.jsx";
import ExploreSheets from "./pages/ExploreSheets.jsx";

// Components
import Footer from "./components/Footer.jsx";

// Theme Provider
import { ThemeProvider } from "./ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        < git Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<DashboardLayout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/workspace" element={<MyWorkspace />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/explore-sheets" element={<ExploreSheets />} /> {/* ✅ Explore Sheets */}
        </Routes>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}