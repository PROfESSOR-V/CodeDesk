import { useState, useEffect, useRef } from "react";
import { FaUser, FaImage, FaGraduationCap, FaTrophy, FaBuilding, FaCode, FaLock, FaIdBadge, FaCheckCircle, FaTrashAlt } from "react-icons/fa";
import anime from "animejs";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

// Helper function to check authentication
const checkAuthentication = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Reusable component for section headers
const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-6 border-b pb-2">
    <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
    {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
  </div>
);

// Reusable component for the main card container
const ContentCard = ({ children, className = "" }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const sections = [
  { id: "basic", label: "Basic Info", icon: <FaUser /> },
  { id: "about", label: "About me", icon: <FaImage /> },
  { id: "education", label: "Education", icon: <FaGraduationCap /> },
  { id: "achievements", label: "Achievements", icon: <FaTrophy /> },
  { id: "work", label: "Work Experience", icon: <FaBuilding /> },
  { id: "platforms", label: "Platform", icon: <FaCode /> },
  { id: "accounts", label: "Accounts", icon: <FaIdBadge /> },
  { id: "security", label: "Visibility", icon: <FaLock /> },
];

export default function EditProfile() {
  const navigate = useNavigate();
  const [active, setActive] = useState("basic");
  const [profile, setProfile] = useState(null);
  const mainRef = useRef(null);
  const [tokenState, setTokenState] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on component mount and fetch profile
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setTokenState(session.access_token);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.status === 401) {
          navigate('/login');
          return;
        }
        if (!res.ok) {
          console.error('Failed to fetch profile:', res.status);
          setProfile(null);
          return;
        }
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTokenState(session?.access_token || "");
    });
    return () => subscription.unsubscribe();
  }, []);

  // Anime JS animation for section transitions
  useEffect(() => {
    if (mainRef.current) {
      anime({
        targets: mainRef.current.children,
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        duration: 600,
        easing: "easeOutQuad",
      });
    }
  }, [active]);

  const renderSection = () => {
    switch (active) {
      case "basic": return <BasicInfo profile={profile} tokenState={tokenState} />;
      case "about": return <AboutMe profile={profile} tokenState={tokenState} />;
      case "education": return <Education profile={profile} tokenState={tokenState} />;
      case "achievements": return <Achievements profile={profile} tokenState={tokenState} />;
      case "work": return <WorkExperience profile={profile} tokenState={tokenState} />;
      case "platforms": return <Platforms profile={profile} tokenState={tokenState} />;
      case "accounts": return <Accounts profile={profile} tokenState={tokenState} />;
      case "security": return <VisibilitySection profile={profile} tokenState={tokenState} />;
      default: return null;
    }
  };

  return (

    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-6 hidden md:block">
        <button
          className="text-sm text-[#e67829] font-medium mb-6 flex items-center gap-2 transition-colors hover:text-orange-600"
          onClick={() => window.history.back()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Profile
        </button>
        <nav className="space-y-2 text-sm">
          {sections.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`w-full flex items-center gap-4 py-2 px-4 rounded-lg transition-colors duration-200 ${
                active === id
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-500 text-lg">Loading profile data...</div>
          </div>
        ) : (
          <div ref={mainRef} className="space-y-8">
            {renderSection()}
          </div>
        )}
      </main>

 <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* Sidebar */}
  <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 hidden md:block">
    
    {/* Back Button */}
    <button
      className="text-sm text-[#e67829] mb-6 hover:underline"
      onClick={async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            navigate('/login');
          } else {
            window.history.back();
          }
        } catch (err) {
          console.error("Failed to check session:", err);
          navigate('/login');
        }
      }}
    >
      &larr; Back to Profile
    </button>

    {/* Section Navigation */}
    <nav className="space-y-1 text-sm">
      {sections.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setActive(id)}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded transition-colors
            hover:bg-gray-100 dark:hover:bg-gray-700 
            ${active === id ? "bg-gray-100 dark:bg-gray-700 font-medium" : ""}`}
        >
          <span className="text-lg">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  </aside>



   {/* Content */}
<div
  className="flex-1 p-6 bg-white dark:bg-gray-900 transition-colors duration-300"
  ref={mainRef}
>
  {/* Each section component receives the profile data */}
  {active === "basic" && <BasicInfo profile={profile} />}
  {active === "about" && <AboutMe profile={profile} />}
  {active === "education" && <Education profile={profile} />}
  {active === "achievements" && <Achievements profile={profile} />}
  {active === "work" && <WorkExperience profile={profile} />}
  {active === "platforms" && <Platforms profile={profile} tokenState={tokenState} />}
  {active === "accounts" && <Accounts profile={profile} />}
  {active === "security" && <VisibilitySection profile={profile} />}
</div>

{/* Loading state */}
{!profile && (
  <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
    <div className="text-gray-500 dark:text-gray-400">Loading profile data...</div>
  </div>
)}

    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{title}</h2>
      {subtitle && (
        <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xl">{subtitle}</p>
      )}

    </div>
  );
}

// Sub-component for Basic Info
function BasicInfo({ profile, tokenState }) {
  const [first, setFirst] = useState(profile?.first_name || "");
  const [last, setLast] = useState(profile?.last_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [country, setCountry] = useState(profile?.country || "India");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || "");
    };
    getUser();
  }, []);

  const save = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenState}` },
        body: JSON.stringify({ firstName: first, lastName: last, bio, country }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile. Please try again.");
    }
  };

  return (

    <ContentCard>
      <SectionHeading title="Basic Info" subtitle="You can manage your essential details here." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">First Name *</label>
          <input value={first} onChange={(e) => setFirst(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="First name" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input value={last} onChange={(e) => setLast(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Last name" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input value={email} disabled className="w-full border rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" placeholder="Email" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="block text-sm font-medium text-gray-700">Bio (max 200 chars)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="4" className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Write something about yourself..." />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="block text-sm font-medium text-gray-700">Country *</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
            <option>India</option>
            <option>USA</option>
          </select>
        </div>
      </div>
      <button onClick={save} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
        Save Changes
      </button>
    </ContentCard>
  );
}

// Sub-component for About Me
function AboutMe({ profile, tokenState }) {
  const [about, setAbout] = useState(profile?.about || "");

  const save = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenState}` },
        body: JSON.stringify({ about }),
      });
      if (!res.ok) throw new Error("Failed to save about section");
      alert("About section saved!");
    } catch (error) {
      console.error('Error saving about section:', error);
      alert('Failed to save changes');
    }
  };

  return (
    <ContentCard>
      <SectionHeading title="About Me" subtitle="Add a brief introduction about yourself to your public profile." />
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows="8"
        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        placeholder="Tell people about your skills, interests, and professional journey."
      />
      <button onClick={save} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
        Update Changes
      </button>
    </ContentCard>
  );
}

// Sub-component for Education
function Education({ profile, tokenState }) {
  const [entries, setEntries] = useState(profile?.education || []);

    <div>
  <SectionHeading
    title="Basic Info"
    subtitle="You can manage your details here."
  />
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        First Name *
      </label>
      <input
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="First name"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        Last Name
      </label>
      <input
        value={last}
        onChange={(e) => setLast(e.target.value)}
        className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Last name"
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        Email
      </label>
      <input
        value={email}
        disabled
        className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-300 dark:border-gray-600"
        placeholder="Email"
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        Bio (max 200 chars)
      </label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows="4"
        className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Write something about you..."
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        Country *
      </label>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option>India</option>
        <option>USA</option>
      </select>
    </div>
  </div>
  <button
    onClick={save}
    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    Save
  </button>
</div>

  );
}
function Education({ profile }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (profile?.education) {
      setEntries(profile.education);
    }
  }, [profile]);


  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: Date.now(), degree: "", school: "", gradeType: "CGPA", score: "", from: {}, to: {} },
    ]);
  };
  const updateEntry = (id, field, value) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };
  const removeEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const save = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenState}` },
        body: JSON.stringify({ education: entries }),
      });
      if (!res.ok) throw new Error("Failed to save education details");
      alert("Education saved successfully!");
    } catch (err) {
      console.error('Error saving education:', err);
      alert('Failed to save education details');
    }
  };

  return (

    <ContentCard>
      <SectionHeading title="Education" subtitle="Add your academic background, degrees, and institutions." />
      <div className="space-y-6">
        {entries.map((edu) => (
          <div key={edu.id} className="border border-gray-200 rounded-lg p-4 relative">
            <button onClick={() => removeEntry(edu.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors">
              <FaTrashAlt />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
                <input value={edu.degree} onChange={(e) => updateEntry(edu.id, 'degree', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" placeholder="e.g., B.Tech" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School / College *</label>
                <input value={edu.school} onChange={(e) => updateEntry(edu.id, 'school', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" placeholder="e.g., IIT Delhi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Type</label>
                <select value={edu.gradeType} onChange={(e) => updateEntry(edu.id, 'gradeType', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm">

    <div>
      <SectionHeading title="Education" subtitle="Add your education details." />
      <button
        onClick={addEntry}
        className="mb-4 text-[#e67829] font-medium hover:underline"
      >
        + Add Education
      </button>
      <div className="space-y-8">
        {entries.map((edu) => (
          <div
            key={edu.id}
            className="border border-gray-300 dark:border-gray-700 rounded p-4 bg-white dark:bg-gray-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Degree *
                </label>
                <input
                  value={edu.degree}
                  onChange={(e) => updateEntry(edu.id, "degree", e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="B.Tech"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  School / College *
                </label>
                <input
                  value={edu.school}
                  onChange={(e) => updateEntry(edu.id, "school", e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="IIT ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Grade Type
                </label>
                <select
                  value={edu.gradeType}
                  onChange={(e) => updateEntry(edu.id, "gradeType", e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option>CGPA</option>
                  <option>GPA</option>
                  <option>Percentage</option>
                </select>
              </div>
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                <input value={edu.score} onChange={(e) => updateEntry(edu.id, 'score', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" placeholder="e.g., 8.5" />

                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Score
                </label>
                <input
                  value={edu.score}
                  onChange={(e) => updateEntry(edu.id, "score", e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8.5"
                />

              </div>
            </div>
          </div>
        ))}
        <button onClick={addEntry} className="text-blue-600 font-medium flex items-center gap-2 transition-colors hover:text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Education
        </button>
      </div>

      <button onClick={save} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">

      <button
        onClick={async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              alert("Please log in again");
              return;
            }

            const res = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ education: entries }),
              }
            );

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            alert("Education saved successfully");

            // Refresh profile data
            const profileRes = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/profile`,
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            const profileData = await profileRes.json();
            if (profileData?.education) setEntries(profileData.education);
          } catch (error) {
            console.error("Error saving education:", error);
            alert("Failed to save education details");
          }
        }}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >

        Save
      </button>
    </ContentCard>
  );
}


// Sub-component for Achievements
function Achievements({ profile, tokenState }) {
  const [items, setItems] = useState(profile?.achievements || []);

  const addItem = () => setItems((p) => [...p, { id: Date.now(), title: "", description: "", url: "" }]);
  const update = (id, field, val) => setItems((p) => p.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeItem = (id) => setItems((p) => p.filter(i => i.id !== id));

  const save = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenState}` },
        body: JSON.stringify({ achievements: items }),
      });
      if (!res.ok) throw new Error("Failed to save achievements");
      alert("Achievements saved successfully!");
    } catch (err) {
      console.error('Error saving achievements:', err);
      alert('Failed to save achievements');
    }
  };

  return (
    <ContentCard>
      <SectionHeading title="Achievements" subtitle="Showcase your awards, certifications, and notable accomplishments." />
      <div className="space-y-6">
        {items.map(item => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 relative">
            <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors">
              <FaTrashAlt />
            </button>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={item.title} onChange={(e) => update(item.id, 'title', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" placeholder="e.g., Google Summer of Code 2023" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={item.description} onChange={(e) => update(item.id, 'description', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" rows="3" placeholder="Briefly describe what you did or accomplished." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL (optional)</label>
                <input value={item.url} onChange={(e) => update(item.id, 'url', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" placeholder="Link to a certificate, article, or project." />

function Achievements({ profile }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (profile?.achievements) {
      setItems(profile.achievements);
    }
  }, [profile]);

  const addItem = () => {
    setItems((prev) => [...prev, { id: Date.now(), title: "", description: "", url: "" }]);
  };

  const update = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div>
      <SectionHeading title="Achievements" subtitle="Showcase your achievements" />
      <button onClick={addItem} className="mb-4 text-[#e67829] font-medium hover:underline">
        + Add Achievement
      </button>
      <div className="space-y-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-gray-300 dark:border-gray-700 rounded p-4 bg-white dark:bg-gray-800"
          >
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Title *
                </label>
                <input
                  value={item.title}
                  onChange={(e) => update(item.id, "title", e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Description
                </label>
                <textarea
                  value={item.description}
                  onChange={(e) => update(item.id, "description", e.target.value)}
                  rows="3"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  URL
                </label>
                <input
                  value={item.url}
                  onChange={(e) => update(item.id, "url", e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="text-blue-600 font-medium flex items-center gap-2 transition-colors hover:text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Achievement
        </button>
      </div>

      <button onClick={save} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">

      <button
        onClick={async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              alert("Please log in again");
              return;
            }

            const res = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ achievements: items }),
              }
            );

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            alert("Achievements saved successfully");

            // Refresh profile data
            const profileRes = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/profile`,
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            const profileData = await profileRes.json();
            if (profileData?.achievements) setItems(profileData.achievements);
          } catch (error) {
            console.error("Error saving achievements:", error);
            alert("Failed to save achievements");
          }
        }}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >

        Save
      </button>
    </ContentCard>
  );
}


// Sub-component for Work Experience
function WorkExperience({ profile, tokenState }) {
  const [jobs, setJobs] = useState(profile?.work_experience || []);



function WorkExperience({ profile }) {
  const [jobs, setJobs] = useState([]);


  const add = () => setJobs(p => [...p, { id: Date.now(), role: "", company: "", desc: "" }]);
  const update = (id, f, v) => setJobs(p => p.map(j => j.id === id ? { ...j, [f]: v } : j));
  const remove = (id) => setJobs(p => p.filter(j => j.id !== id));

  const save = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenState}` },
        body: JSON.stringify({ workExperience: jobs }),
      });
      if (!res.ok) throw new Error("Failed to save work experience");
      alert("Experience saved successfully!");
    } catch (err) {
      console.error('Error saving work experience:', err);
      alert('Failed to save work experience');
    }
  };


  return (
    <ContentCard>
      <SectionHeading title="Work Experience" subtitle="List your internships, jobs, and volunteer work." />
      <div className="space-y-6">
        {jobs.map(job => (
          <div key={job.id} className="border border-gray-200 rounded-lg p-4 relative">
            <button onClick={() => remove(job.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors">
              <FaTrashAlt />
            </button>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Role *</label>
                <input value={job.role} onChange={(e) => update(job.id, 'role', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" placeholder="e.g., Software Engineer Intern" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <input value={job.company} onChange={(e) => update(job.id, 'company', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" placeholder="e.g., Google" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={job.desc} onChange={(e) => update(job.id, 'desc', e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" rows="3" placeholder="Briefly describe your responsibilities and impact." />

  const add = () =>
    setJobs((p) => [...p, { id: Date.now(), role: "", company: "", desc: "" }]);
  const update = (id, f, v) =>
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, [f]: v } : j)));

  return (
    <div>
      <SectionHeading title="Experience" subtitle="Add your work experience." />
      <button
        onClick={add}
        className="mb-4 text-[#e67829] font-medium hover:underline"
      >
        + Add Experience
      </button>
      <div className="space-y-8">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="border border-gray-300 dark:border-gray-700 rounded p-4 bg-white dark:bg-gray-800"
          >
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Job Description *
                </label>
                <input
                  value={job.role}
                  onChange={(e) => update(job.id, "role", e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Company *
                </label>
                <input
                  value={job.company}
                  onChange={(e) => update(job.id, "company", e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Description
                </label>
                <textarea
                  value={job.desc}
                  onChange={(e) => update(job.id, "desc", e.target.value)}
                  rows="3"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>
            </div>
          </div>
        ))}
        <button onClick={add} className="text-blue-600 font-medium flex items-center gap-2 transition-colors hover:text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Experience
        </button>
      </div>

      <button onClick={save} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">

      <button
        onClick={async () => {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
              alert("Please log in again");
              return;
            }

            const res = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ workExperience: jobs }),
              }
            );

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            alert("Experience saved successfully");

            const profileRes = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/profile`,
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            const profileData = await profileRes.json();
            if (profileData?.work_experience) setJobs(profileData.work_experience);
          } catch (error) {
            console.error("Error saving work experience:", error);
            alert("Failed to save work experience");
          }
        }}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >

        Save
      </button>
    </ContentCard>
  );
}

// Sub-component for Platforms
function Platforms({ profile, tokenState }) {
  const initial = [
    { id: "leetcode", label: "LeetCode", url: "", verified: false },
    { id: "codeforces", label: "Codeforces", url: "", verified: false },
    { id: "gfg", label: "GeeksForGeeks", url: "", verified: false },
    { id: "codechef", label: "CodeChef", url: "", verified: false },
    { id: "hackerrank", label: "HackerRank", url: "", verified: false },
  ];
  const [profiles, setProfiles] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (profile?.platforms) {
        const mergedProfiles = initial.map(platform => {
          const savedPlatform = profile.platforms.find(p => p.id === platform.id);
          return savedPlatform ? { ...platform, url: savedPlatform.url, verified: savedPlatform.verified } : platform;
        });
        setProfiles(mergedProfiles);
      } else {
        setProfiles(initial);
      }
    } catch (error) {
      console.error("Error processing platforms data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  const baseUrls = {
    leetcode: "https://leetcode.com/u/",
    codeforces: "https://codeforces.com/profile/",
    gfg: "https://auth.geeksforgeeks.org/user/",
    codechef: "https://www.codechef.com/users/",
    hackerrank: "https://www.hackerrank.com/profile/",
  };

  const updateUsername = (id, username) => {
    setProfiles((p) => p.map((pl) => (
      pl.id === id ? { ...pl, url: username.trim() ? `${baseUrls[id]}${username}` : "" } : pl
    )));
  };

  const openVerifyModal = async (id) => {
    try {
      const platform = profiles.find((p) => p.id === id);
      if (!platform || !platform.url) {
        alert("Please enter your profile username first.");
        return;
      }
      const accessToken = tokenState;
      if (!accessToken) {
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/verification/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ platformId: id, profileUrl: platform.url }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error initializing verification");
      }
      const data = await response.json();
      setToken(data.verificationCode);
      setVerifyTarget(id);
      setModalOpen(true);
    } catch (err) {
      console.error("Verification initialization error:", err);
      alert(err.message || "An unexpected error occurred during verification initialization");
    }
  };

  const confirmVerification = async () => {
    try {
      const platform = profiles.find(p => p.id === verifyTarget);
      if (!platform || !platform.url || !token) throw new Error("Missing verification data. Please try again.");

      const isVerified = await verifyPlatformProfile(platform.url, token, verifyTarget);
      if (isVerified) {
        setProfiles((p) => p.map((pl) => pl.id === verifyTarget ? { ...pl, verified: true } : pl));
        alert(`${platform.label} profile verified successfully!`);
        // Trigger backend scrapes if needed
        if (verifyTarget === "codeforces" || verifyTarget === "gfg") {
          const accessToken = tokenState;
          const handle = (platform.url || "").split("/").filter(Boolean).pop();
          const scrapeEndpoint = verifyTarget === "codeforces" ? "/api/codeforces/scrape" : "/api/gfg/scrape";
          const body = verifyTarget === "codeforces" ? { codeforcesHandle: handle } : { username: handle, supabase_id: profile.id };
          await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${scrapeEndpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify(body),
          });
        }
        setModalOpen(false);
      } else {
        throw new Error(`Verification failed. Please ensure you've updated your display name to: ${token}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert(error.message);
    }
  };

  const verifyPlatformProfile = async (url, verificationCode, platformId) => {
    try {
      const accessToken = tokenState;
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/verification/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ platformId, profileUrl: url, verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed.');
      return data.verified === true;
    } catch (error) {
      console.error('Error verifying platform:', error);
      return false;
    }
  };

  const removePlatform = async (platformId) => {
    if (!confirm("Are you sure you want to remove this platform?")) return;
    try {
      const accessToken = tokenState;
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/platform`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ platformId }),
      });
      if (!res.ok) throw new Error(`Failed to remove platform: ${res.status}`);
      setProfiles(current => current.map(p => p.id === platformId ? { ...p, verified: false, url: '' } : p));
      alert('Platform removed successfully');
    } catch (error) {
      console.error('Error removing platform:', error);
      alert('Failed to remove platform');
    }
  };


  return (
    <ContentCard>
      <SectionHeading title="Platforms" subtitle="Add and verify your competitive programming profiles to get ranked." />
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-gray-500">Loading platforms...</div>
      ) : (
        <div className="space-y-6">
          <h3 className="font-semibold text-gray-700">Problem Solving Platforms</h3>
          <div className="space-y-4 max-w-3xl">
            {profiles.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row items-center gap-3">
                <span className="w-40 font-medium text-gray-600">{p.label}</span>
                <div className="flex-1 w-full flex border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="bg-gray-100 text-gray-500 text-xs px-3 py-2 flex items-center select-none">
                    {baseUrls[p.id]}
                  </span>
                  <input
                    value={p.url.replace(baseUrls[p.id], "")}
                    onChange={(e) => updateUsername(p.id, e.target.value)}
                    placeholder="username"
                    className="flex-1 px-3 py-2 text-sm outline-none"
                  />
                </div>
                {p.verified ? (
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <span className="text-green-600 text-2xl" title="Verified">&#10003;</span>
                    <button onClick={() => removePlatform(p.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Remove platform">
                      <FaTrashAlt />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openVerifyModal(p.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    Submit
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
              try {
                const accessToken = tokenState;
                const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
                  body: JSON.stringify({ platforms: profiles }),
                });
                if (!res.ok) throw new Error("Failed to save platforms");
                alert("Platforms saved successfully!");
              } catch (error) {
                console.error('Error saving platforms:', error);
                alert('Failed to save platforms');
              }
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            Save
          </button>
        </div>
      )}
      {modalOpen && (
        <VerifyModal code={token} onClose={() => setModalOpen(false)} onVerify={confirmVerification} />
      )}
    </ContentCard>
  );

  const confirmVerification = async () => {
    try {
      const platform = profiles.find(p => p.id === verifyTarget);
      if (!platform) {
        throw new Error('Selected platform not found');
      }

      if (!platform.url) {
        throw new Error('Please enter your profile URL first');
      }

      if (!token) {
        throw new Error('Verification code not found. Please try again.');
      }

      // Update UI to show verification in progress
      const button = document.querySelector('#verifyButton');
      if (button) {
        button.disabled = true;
        button.textContent = 'Verifying...';
      }

      // Wait for profile update to propagate
      const delay = 5000; // 5 seconds delay
      console.log(`Waiting ${delay}ms for profile update to propagate...`);
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log('Starting verification process for', platform.label);
      const isVerified = await verifyPlatformProfile(platform.url, token);
      console.log('Verification result:', isVerified);

      if (isVerified) {
        // Update local state
        setProfiles((p) => p.map((pl) => 
          pl.id === verifyTarget ? { ...pl, verified: true } : pl
        ));
        
        // Show success message
        alert(`${platform.label} profile verified successfully!`);

        // If Codeforces verified, trigger backend scrape to populate stats
        if (verifyTarget === "codeforces") {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
            const handle = (platform.url || "").split("/").filter(Boolean).pop();
            const body = handle ? { codeforcesHandle: handle } : { profileUrl: platform.url };
            await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/codeforces/scrape`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(body),
            });
          } catch (cfErr) {
            console.error("Codeforces scrape trigger failed:", cfErr);
          }
        }

        // Trigger external scraper service for GFG after verification
        if (verifyTarget === "gfg") {
          try {
            // Extract GFG username from URL (last segment after /user/ or trailing slash)
            // Clean username from URL (remove any query/hash)
            let gfgUsername;
            try {
              const parsed = new URL(platform.url.startsWith("http") ? platform.url : `https://auth.geeksforgeeks.org/user/${platform.url}`);
              const segments = parsed.pathname.split("/").filter(Boolean);
              gfgUsername = segments[segments.length - 1] || "";
            } catch {
              // Fallback: last segment of the string before ? or #
              const parts = platform.url.split("/").filter(Boolean);
              gfgUsername = parts[parts.length - 1] || "";
            }
            gfgUsername = gfgUsername.split("?")[0].split("#")[0];

            // Get Supabase user id to pass to scraper
            const { data: { user: supaUser } } = await supabase.auth.getUser();
            if (!supaUser?.id) {
              console.error("Supabase user not found, cannot trigger GFG scraper");
            } else {
              // Delay trigger by 5 seconds to ensure profile stats are reflected
              setTimeout(async () => {
                try {
                  await fetch("https://gfg-scraper-jns7.onrender.com/scrape", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      username: gfgUsername,
                      supabase_id: supaUser.id,
                    }),
                  });
                  console.log("✅ Triggered GFG scraper for", gfgUsername);
                } catch (fetchErr) {
                  console.error("Trigger request failed:", fetchErr);
                }
              }, 5000);
            }
          } catch (scrapeErr) {
            console.error("Error triggering GFG scraper:", scrapeErr);
          }
        }
        setModalOpen(false);
      } else {
        throw new Error(`Verification failed. Please ensure:\n\n1. You've updated your ${platform.label} profile name to: ${token}\n2. The changes are saved and public\n3. The profile URL is correct`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert(error.message);
    } finally {
      // Reset button state
      const button = document.querySelector('#verifyButton');
      if (button) {
        button.disabled = false;
        button.textContent = 'Verify';
      }
    }
  };

return (
  <div>
    <SectionHeading
      title="Platforms"
      subtitle="Update and verify your platform details here."
    />

    {isLoading ? (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading platforms...</div>
      </div>
    ) : (
      <div>
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Problem Solving
        </h3>
        <div className="space-y-4 max-w-3xl">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2"
            >
              <span className="w-32 text-gray-900 dark:text-gray-100">{p.label}</span>
              <div className="flex-1 flex">
                <span className="px-2 py-1 border border-r-0 rounded-l bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-sm select-none">
                  {baseUrls[p.id]}
                </span>
                <input
                  value={p.url.replace(baseUrls[p.id], "")}
                  onChange={(e) => update(p.id, e.target.value)}
                  placeholder="username"
                  className="flex-1 border rounded-r px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {p.verified ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">&#10003;</span>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to remove your ${p.label} profile?`
                        )
                      ) {
                        removePlatform(p.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                    title="Remove platform"
                  >
                    &#10007;
                  </button>
                </div>
              ) : (
                <button className="bg-blue-600 text-white text-sm px-3 py-1 rounded" onClick={() => openVerifyModal(p.id)}>
                  Submit
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={async () => {
            try {
              const accessToken = tokenState;
              if (!accessToken) {
                alert("Please log in again");
                return;
              }

              const res = await fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:5000"
                }/api/users/sections`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({ platforms: profiles }),
                }
              );

              if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

              alert("Platforms saved successfully");

              const profileRes = await fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:5000"
                }/api/users/profile`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              const profileData = await profileRes.json();
              if (profileData?.platforms) setProfiles(profileData.platforms);
            } catch (error) {
              console.error("Error saving platforms:", error);
              alert("Failed to save platforms");
            }
          }}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    )}

    {modalOpen && (
      <VerifyModal
        code={token}
        onClose={() => setModalOpen(false)}
        onVerify={confirmVerification}
      />
    )}
  </div>
);


}

// Reusable Verification Modal Component
function VerifyModal({ code, onClose, onVerify }) {
  const modalRef = useRef(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (modalRef.current) {
      anime({
        targets: modalRef.current,
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 400,
        easing: "easeOutCubic"
      });
    }
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await onVerify();
      onClose();
    } catch (e) {
      console.error(e);
      alert(e.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (

    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold mb-2 text-gray-800">Verify Profile</h3>
        <p className="text-sm text-gray-600 mb-4">Follow these steps to complete the verification:</p>
        <ol className="text-sm list-decimal list-inside space-y-3 pl-2 text-gray-700">
          <li>Go to your profile settings on the platform.</li>
          <li>Change your public display name to exactly: <span className="font-mono font-bold bg-gray-100 text-blue-700 px-2 py-1 rounded-md inline-block mt-1">{code}</span></li>
          <li>Save the changes on their website.</li>
          <li>Click the button below to confirm.</li>
        </ol>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors" disabled={isVerifying}>
            Cancel
          </button>
          <button onClick={handleVerify} className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-400" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

  <div className="fixed inset-0 pointer-events-none flex items-start justify-center z-50" style={{ marginTop: "100px" }}>
    <div
      ref={modalRef}
      className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg p-6 shadow-xl pointer-events-auto"
    >
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Verification Required</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">Follow these steps to verify your profile:</p>
        <ol className="text-sm list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Go to your profile settings on the platform</li>
          <li>Change your display name to exactly: <span className="font-mono font-bold">{code}</span></li>
          <li>Save the changes on the platform</li>
          <li>Click Verify below</li>
        </ol>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Note: You can change your display name back after verification is complete.
        </p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button 
          onClick={onClose} 
          className="px-4 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          disabled={isVerifying}
        >
          Cancel
        </button>
        <button 
          id="verifyButton"
          onClick={handleVerify} 
          className="px-4 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
          disabled={isVerifying}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>

      </div>
    </div>
  </div>
);


// Sub-component for Accounts
function Accounts({ profile, tokenState }) {
  const [username, setUsername] = useState(profile?.username || "");
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || "");

}
function Accounts({ profile, tokenState }) {
  const [username, setUsername] = useState(profile?.username || "");
  useEffect(() => {
    if (profile) setUsername(profile.username || "");
  }, [profile]);

  const [currPass, setCurrPass] = useState("");

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [photoModal, setPhotoModal] = useState(false);


  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setPhotoUrl(profile.photo_url || "");
    }
  }, [profile]);

  const updateUsername = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenState}` },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error("Failed to update username");
      alert("Username updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating username. It may already be taken.");
    }
  };

  const updatePassword = async () => {
    if (newPass !== confirmPass) {
      alert("New passwords don't match!");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      alert("Password updated successfully!");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      alert(err.message || "Error updating password.");
    }
  };

  return (
    <ContentCard>
      <SectionHeading title="Account" subtitle="Manage your profile photo, username, and password." />
      <div className="space-y-8 max-w-xl">
        {/* Profile photo */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                {username ? username.charAt(0).toUpperCase() : "C"}
              </div>
            )}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Profile Photo</label>
            <button onClick={() => setPhotoModal(true)} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50 transition-colors">
              Change Photo
            </button>
          </div>

  const onPhotoChange = () => setPhotoModal(true);

  return (
    <div className="max-w-xl space-y-8">
      <SectionHeading
        title="Accounts"
        subtitle="Manage your photo, username and password."
      />

      {/* Profile photo */}
      <div className="flex items-center gap-6">
        {profile?.photo_url ? (
          <img
            src={profile.photo_url}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border dark:border-gray-600"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold border dark:border-gray-600 text-gray-800 dark:text-gray-100">
            {username ? username.charAt(0).toUpperCase() : "C"}
          </div>
        )}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            Profile Photo
          </label>
          <button
            onClick={onPhotoChange}
            className="px-3 py-1.5 rounded border text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            Change Photo
          </button>

        </div>


        {/* Username */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">CodeDesk ID (username)</label>
          <div className="flex">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-l-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="your_username"
            />
            <button onClick={updateUsername} className="bg-blue-600 text-white px-4 py-2 rounded-r-md text-sm font-medium hover:bg-blue-700 transition-colors">
              Update
            </button>
          </div>
        </div>

        {/* Password change */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Change Password</label>
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="New password" />
          <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Confirm new password" />
          <button onClick={updatePassword} className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
            Update Password
          </button>
        </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
          CodeDesk ID (username)
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="your_username"
        />
        <button
          onClick={async () => {
            try {
              await fetch(
                `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenState}`,
                  },
                  body: JSON.stringify({ username }),
                }
              );
              alert("Username updated successfully");
            } catch (err) {
              alert("Error updating username");
            }
          }}
          className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          Update Username
        </button>
      </div>

      {/* Password change */}
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
          Change Password
        </label>
        <input
          type="password"
          value={currPass}
          onChange={(e) => setCurrPass(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Current password"
        />
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="New password"
        />
        <input
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Confirm new password"
        />
        <button
          onClick={async () => {
            if (newPass !== confirmPass) {
              alert("New passwords don't match!");
              return;
            }
            try {
              const { error } = await supabase.auth.updateUser({
                password: newPass,
              });
              if (error) throw error;
              alert("Password updated successfully");
              setCurrPass("");
              setNewPass("");
              setConfirmPass("");
            } catch (err) {
              alert(err.message || "Error updating password");
            }
          }}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
        >
          Update Password
        </button>

      </div>

      {/* Photo modal */}
      {photoModal && (

        <VerifyModal code="Profile photo feature coming soon" onClose={() => setPhotoModal(false)} onVerify={() => {}} />

        <VerifyModal
          code="Profile photo feature coming soon"
          onClose={() => setPhotoModal(false)}
          onVerify={() => setPhotoModal(false)}
        />

      )}
    </ContentCard>
  );
}

// Sub-component for Visibility
function VisibilitySection() {
  return (

    <ContentCard className="bg-gray-50 border-dashed">
      <SectionHeading title="Visibility" subtitle="Control who can see different sections of your profile." />
      <p className="text-gray-500 text-center py-8">
        <FaLock className="inline-block text-2xl mr-2 text-gray-400" />
        Visibility settings are coming soon!
      </p>
    </ContentCard>
  );
}

    <div>
      <SectionHeading title="Visibility" subtitle="Control who sees your profile." />
      <p className="text-gray-500 dark:text-gray-400">
        Visibility settings coming soon...
      </p>
    </div>
  );
}


 

