import LandingNavbar from "../components/LandingNavbar.jsx";

export default function Terms() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen flex flex-col">
      {/* Navbar */}
      <LandingNavbar />

      {/* Content */}
      <div className="flex-1 py-12 px-6 md:px-20 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Terms & Conditions
        </h1>
        <p className="mb-4 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          These Terms & Conditions govern your use of{" "}
          <strong className="text-[#e67829]">CodeDesk</strong>. By accessing our
          website, you agree to comply with these terms.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">
          1. Use of Service
        </h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
          You must not misuse our services or attempt to disrupt their operation.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">
          2. User Responsibilities
        </h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
          You are responsible for maintaining the confidentiality of your account
          information and activity.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">
          3. Modifications
        </h2>
        <p className="mb-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
          We reserve the right to modify these terms at any time. Continued use of
          the service constitutes acceptance of the new terms.
        </p>

        <p className="mt-10 text-sm text-gray-600 dark:text-gray-400 border-t pt-4">
          If you have any questions about our Terms & Conditions, please contact
          us at{" "}
          <a
            href="mailto:support@codedesk.com"
            className="text-[#e67829] hover:underline"
          >
            support@codedesk.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
