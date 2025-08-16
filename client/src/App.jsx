import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Terms from "./pages/Terms";
import Footer from "./components/Footer.jsx";
import Privacy from "./pages/Privacy";
import MyWorkspace from "./pages/MyWorkspace.jsx";

// 🔑 import ThemeProvider + hook
import { ThemeProvider } from "./ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<DashboardLayout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/workspace" element={<MyWorkspace />} /> 
        </Routes>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

