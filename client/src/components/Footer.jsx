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

  const marginClass = needsSidebarSpacing ? "md:ml-16 lg:ml-64" : "";

  return (
    <footer className={`bg-[#e9ecef] text-gray-900 py-8 mt-10 transition-all duration-300 ${marginClass}`}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Branding */}
        <div>
          <div onClick={() => navigate("/")}>
                  <BrandName className="text-2xl font-bold cursor-pointer" />
                </div>
          <p className="mt-2 text-sm">
            CodeDesk helps you navigate and track your coding journey to success.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-black mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <button onClick={() => navigate('/signup')} className="hover:text-[#e67829]">
                Leaderboard
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/signup')} className="hover:text-[#e67829]">
                Question Tracker
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/signup')} className="hover:text-[#e67829]">
                Event Tracker
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/signup')} className="hover:text-[#e67829]">
                Profile Tracker
              </button>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-lg font-semibold text-black mb-3">Legal</h3>
          <ul className="space-y-2">
            <li>
              <button onClick={() => navigate('/terms')} className="hover:text-[#e67829]">
                Terms & Conditions
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/privacy')} className="hover:text-[#e67829]">
                Privacy Policy
              </button>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-lg font-semibold text-black mb-3">Follow Us</h3>
          <div className="flex space-x-4 text-2xl">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e67829]">
              <FaGithub />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e67829]">
              <FaLinkedin />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e67829]">
              <FaXTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e67829]">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm">
        © {new Date().getFullYear()} CodeDesk. All rights reserved.
      </div>
    </footer>
  );
}
