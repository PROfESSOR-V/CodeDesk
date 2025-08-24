import LandingNavbar from "../components/LandingNavbar.jsx";

export default function Privacy() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen flex flex-col">
      {/* Navbar */}
      <LandingNavbar />

      {/* Content */}
      <div className="max-w-4xl mx-auto py-16 px-6 md:px-20">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Privacy Policy</h1>
        <p className="mb-4 text-lg text-gray-700 dark:text-gray-300">
          At <strong className="text-[#e67829]">CodeDesk</strong>, we value your privacy and are committed to protecting
          your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">1. Information We Collect</h2>
        <p className="mb-4 text-lg text-gray-700 dark:text-gray-300">
          We may collect your name, email address, coding activity, and preferences when you use our services.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">2. How We Use Your Data</h2>
        <p className="mb-4 text-lg text-gray-700 dark:text-gray-300">
          We use your data to improve our services, track your progress, and provide personalized experiences.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">3. Data Security</h2>
        <p className="mb-4 text-lg text-gray-700 dark:text-gray-300">
          We implement strict security measures to protect your information from unauthorized access.
        </p>

        <p className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          If you have any questions about our Privacy Policy, please contact us at{" "}
          <a href="mailto:support@codedesk.com" className="text-[#e67829] hover:underline">
            support@codedesk.com
          </a>.
        </p>
      </div>
    </div>
  );
}
