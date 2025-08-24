import { useNavigate, useLocation } from "react-router-dom";
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import BrandName from "./BrandName.jsx";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect pages where a sidebar exists
  const sidebarPages = ["/dashboard", "/portfolio", "/workspace"];
  const needsSidebarSpacing = sidebarPages.some((p) => location.pathname.startsWith(p));

  // Keep full-width footer on landing and edit-profile pages; otherwise offset for sidebar
  const marginClass = (location.pathname === "/" || location.pathname.startsWith("/profile/edit")) ? "" : "ml-64";

  return (

    <footer className={`bg-gradient-to-r from-orange-200 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-200 py-10 mt-10 transition-all duration-500 rounded-t-3xl shadow-2xl border-t-4 border-orange-300 ${marginClass}`}>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Branding */}
        <div>
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <BrandName className="text-3xl font-extrabold text-[#e67829] dark:text-orange-300 drop-shadow-lg" />
          </div>
          <p className="mt-3 text-base text-gray-700 dark:text-gray-300 font-medium">
            CodeDesk helps you navigate and track your coding journey to success.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#e67829] dark:text-orange-300 tracking-wide">Quick Links</h3>
          <ul className="space-y-3">
            {["Leaderboard","Question Tracker","Event Tracker","Profile Tracker"].map((item) => (
              <li key={item}>
                <button onClick={() => navigate("/signup")} className="hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-[#e67829] dark:hover:text-orange-400 transition-all font-semibold px-3 py-1 rounded-lg">
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#e67829] dark:text-orange-300 tracking-wide">Legal</h3>
          <ul className="space-y-3">
            <li>
              <button onClick={() => navigate("/terms")} className="hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-[#e67829] dark:hover:text-orange-400 transition-all font-semibold px-3 py-1 rounded-lg">
                Terms & Conditions
              </button>
            </li>
            <li>
              <button onClick={() => navigate("/privacy")} className="hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-[#e67829] dark:hover:text-orange-400 transition-all font-semibold px-3 py-1 rounded-lg">
                Privacy Policy
              </button>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#e67829] dark:text-orange-300 tracking-wide">Follow Us</h3>
          <div className="flex space-x-5 text-3xl">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-gray-800 rounded-full p-2 shadow hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-[#e67829] dark:hover:text-orange-400 transition-all">
              <FaGithub />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-gray-800 rounded-full p-2 shadow hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-[#e67829] dark:hover:text-orange-400 transition-all">
              <FaLinkedin />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-gray-800 rounded-full p-2 shadow hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-[#e67829] dark:hover:text-orange-400 transition-all">
              <FaXTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-gray-800 rounded-full p-2 shadow hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-[#e67829] dark:hover:text-orange-400 transition-all">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t-2 border-orange-300 dark:border-orange-700 mt-10 pt-6 text-center text-base font-semibold">
        © {new Date().getFullYear()} <BrandName className="inline text-lg text-[#e67829] dark:text-orange-300 font-bold" />. All rights reserved.
      </div>
    </footer>
  );
}