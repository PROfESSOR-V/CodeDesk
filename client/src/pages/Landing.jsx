import LandingNavbar from "../components/LandingNavbar.jsx";
import heroImg from "../assests/Screenshot 2025-08-02 100819.png";
import BrandName from "../components/BrandName.jsx";
import lcLogo from "../assests/leetcode-logo.png";
import cfLogo from "../assests/codeforces-logo.png";
import gfgLogo from "../assests/gfg-logo.png";
import ccLogo from "../assests/codechef-logo.jpeg";
import hrLogo from "../assests/hackerrank-logo.jpeg";
import { useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import anime from "animejs";
import { ThemeContext } from "../context/ThemeContext.jsx";

export default function Landing() {
  const heroRef = useRef(null);
  const platformRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (heroRef.current) {
      anime({
        targets: heroRef.current.children,
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1000,
        easing: "easeOutExpo",
        delay: anime.stagger(100),
      });
    }

    if (platformRef.current) {
      anime({
        targets: platformRef.current.querySelectorAll("img"),
        scale: [0, 1],
        duration: 800,
        easing: "easeOutBack",
        delay: anime.stagger(100, { start: 500 }),
      });
    }
  }, []);

  const platformLogos = [
    { src: lcLogo, alt: "LeetCode" },
    { src: cfLogo, alt: "Codeforces" },
    { src: gfgLogo, alt: "GeeksforGeeks" },
    { src: ccLogo, alt: "CodeChef" },
    { src: hrLogo, alt: "HackerRank" },
  ];

  // Common Tailwind classes for dark/light mode
  const bgClass = darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-900";
  const sectionBgClass = darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200";
  const cardBgClass = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textGray = darkMode ? "text-gray-300" : "text-gray-600";
  const btnClass = "bg-[#e67829] text-white px-6 py-3 rounded shadow hover:bg-[#e67829]/90 transition";

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${bgClass}`}>
      <LandingNavbar />

      {/* Hero Section */}
      <section ref={heroRef} className="flex flex-col-reverse lg:flex-row items-center gap-12 px-6 py-20 max-w-6xl mx-auto">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-[#e67829]">
            Track, analyse & share
          </h1>
          <p className={`mb-8 text-lg max-w-md transition-colors duration-300 ${textGray}`}>
            <BrandName /> helps you navigate and track your coding journey to success. Connect
            all your favourite coding platforms and see everything in one place.
          </p>
          <button onClick={() => navigate('/signup')} className={btnClass}>
            Try Question Tracker →
          </button>
        </div>
        <div className="flex-1">
          <img
            src={heroImg}
            alt="Profile analytics screenshot"
            className="rounded-lg shadow-lg border transition-colors duration-300"
            width={500}
            height={500}
            style={{ objectFit: "contain", opacity: 0.7 }}
          />
        </div>
      </section>

      {/* Platforms Section */}
      <section className={`py-16 transition-colors duration-300 ${sectionBgClass}`}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">Your Favourite Coding Platforms</h2>
          <p className={`mb-4 transition-colors duration-300 ${textGray}`}>
            Streamlined in <BrandName /> to simplify your coding journey
          </p>
          <div ref={platformRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 items-center">
            {platformLogos.map(({ src, alt }) => (
              <img
                onClick={() => navigate('/signup')}
                key={alt}
                src={src}
                alt={alt}
                className="h-12 mx-auto object-contain"
                style={{ opacity: 0.7 }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Simplify Your Prep Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">
        <div className="flex-1 order-2 lg:order-1">
          <img
            onClick={() => navigate('/signup')}
            src="https://via.placeholder.com/500x350?text=Question+Tracker"
            alt="Question tracker screenshot"
            className={`rounded-lg shadow-lg border transition-colors duration-300 ${cardBgClass}`}
          />
        </div>
        <div className="flex-1 order-1 lg:order-2">
          <h2 className="text-3xl font-bold mb-4">Simplify Your Prep</h2>
          <p className={`mb-6 transition-colors duration-300 ${textGray}`}>
            Say goodbye to last-minute stress. Track all your questions and notes in one place for easy review and revision.
          </p>
          <button onClick={() => navigate('/signup')} className={btnClass}>
            Try Question Tracker →
          </button>
        </div>
      </section>

      {/* All-in-One Coding Portfolio Section */}
      <section className={`py-20 px-6 transition-colors duration-300 ${sectionBgClass}`}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Your All-in-One Coding Portfolio</h2>
            <ul className={`space-y-4 transition-colors duration-300 ${textGray} list-disc list-inside`}>
              <li>See cumulative questions solved</li>
              <li>Track your streak across multiple platforms</li>
              <li>Identify your strengths and areas of improvement</li>
              <li>Get classification of problems solved</li>
              <li>Monitor your ratings in contests over time</li>
              <li>Showcase your achievements</li>
            </ul>
            <button onClick={() => navigate('/signup')} className={`${btnClass} mt-8`}>
              Try Profile Tracker →
            </button>
          </div>
          <img
            onClick={() => navigate('/signup')}
            src="https://via.placeholder.com/500x400?text=Portfolio+Analytics"
            alt="Portfolio analytics"
            className={`rounded-lg shadow-lg border transition-colors duration-300 ${cardBgClass}`}
          />
        </div>
      </section>

      {/* GitHub Tracker Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">
        <div className="flex-1">
          <img
            onClick={() => navigate('/signup')}
            src="https://via.placeholder.com/500x350?text=GitHub+Tracker"
            alt="GitHub tracker screenshot"
            className={`rounded-lg shadow-lg border transition-colors duration-300 ${cardBgClass}`}
          />
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-4">Hub for your Projects and Dev Stats</h2>
          <p className={`mb-6 transition-colors duration-300 ${textGray}`}>
            Unlock the story behind your GitHub contributions – insights, stats and more, all in one place!
          </p>
          <button onClick={() => navigate('/signup')} className={btnClass}>
            Try GitHub Tracker →
          </button>
        </div>
      </section>

      {/* Contest Reminder Section */}
      <section className={`py-20 px-6 transition-colors duration-300 ${sectionBgClass}`}>
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold mb-4">Never Miss a Contest</h2>
          <p className={`mb-8 max-w-xl transition-colors duration-300 ${textGray}`}>
            Track coding contests and set reminders with just one click.
          </p>
          <button onClick={() => navigate('/signup')} className={btnClass}>
            Try Event Tracker →
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "Which coding platforms are supported?",
              a: "We support LeetCode, GeeksforGeeks, CodeChef, Codeforces, AtCoder, HackerRank and more.",
            },
            {
              q: "How do I connect my coding profiles?",
              a: "After signing up, head to the Portfolio Tracker → Setup Profile page and add your handles.",
            },
            {
              q: "How can I change my profile name?",
              a: "Go to Edit Profile → Accounts → Edit, enter a new name and click Update.",
            },
          ].map(({ q, a }, idx) => (
            <details key={idx} className={`rounded-lg p-4 transition-colors duration-300 ${cardBgClass}`}>
              <summary className="font-medium cursor-pointer">{q}</summary>
              <p className={`mt-2 transition-colors duration-300 ${textGray}`}>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
