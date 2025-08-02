import { useState, useEffect, useRef } from "react";
import { FaUser, FaImage, FaGraduationCap, FaTrophy, FaBuilding, FaCode, FaLock, FaIdBadge } from "react-icons/fa";
import anime from "animejs";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

// Helper function to check authentication
const checkAuthentication = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

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

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Set up auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setTokenState(session.access_token);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        setTokenState(session.access_token);
      } else {
        setTokenState("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get the Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No session found');
          navigate('/login'); // Redirect to login if no session
          return;
        }

        // Fetch the logged-in user's profile
        const res = await fetch('http://localhost:5000/api/users/profile', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch profile: ${res.status}`);
        }

        const data = await res.json();
        setProfile(data); // Set the profile data for the logged-in user
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/login'); // Redirect to login on error
      }
    };

    fetchProfile();
  }, [navigate]);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 hidden md:block">
        <button 
          className="text-sm text-[#e67829] mb-6" 
          onClick={async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              navigate('/login');
            } else {
              window.history.back();
            }
          }}
        >
          &larr; Back to Profile
        </button>
        <nav className="space-y-1 text-sm">
          {sections.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`w-full flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-100 ${
                active === id ? "bg-gray-100" : ""
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 p-6" ref={mainRef}>
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading profile data...</div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-1">{title}</h2>
      {subtitle && <p className="text-gray-600 text-sm max-w-xl">{subtitle}</p>}
    </div>
  );
}

function BasicInfo({ profile }) {
  const navigate = useNavigate();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("India");
  const [email, setEmail] = useState("");

  // Check authentication when component mounts
  useEffect(() => {
    const verifyAuth = async () => {
      const session = await checkAuthentication();
      if (!session) {
        navigate('/login');
      }
    };
    verifyAuth();
  }, [navigate]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
      }
    };
    getUser();

    if (profile) {
      setFirst(profile.first_name || "");
      setLast(profile.last_name || "");
      setBio(profile.bio || "");
      if (profile.country) setCountry(profile.country);
    }
  }, [profile]);

  const save = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ firstName: first, lastName: last, bio, country }),
    });
    alert("Profile updated");
  };
  return (
    <div>
      <SectionHeading title="Basic Info" subtitle="You can manage your details here." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <input value={first} onChange={(e)=>setFirst(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="First name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input value={last} onChange={(e)=>setLast(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Last name" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input value={email} disabled className="w-full border rounded px-3 py-2 bg-gray-100" placeholder="Email" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Bio (max 200 chars)</label>
          <textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows="4" className="w-full border rounded px-3 py-2" placeholder="Write something about you..." />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Country *</label>
          <select value={country} onChange={(e)=>setCountry(e.target.value)} className="w-full border rounded px-3 py-2">
            <option>India</option>
            <option>USA</option>
          </select>
        </div>
      </div>
      <button onClick={save} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save</button>
    </div>
  );
}

function AboutMe({ profile }) {
  const [about, setAbout] = useState("");

  useEffect(() => {
    if (profile?.about) {
      setAbout(profile.about);
    }
  }, [profile]);

  const save = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in again');
        return;
      }

      const res = await fetch('http://localhost:5000/api/users/sections', {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ about }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Save response:', data);
      alert("About section saved");
    } catch (error) {
      console.error('Error saving about section:', error);
      alert('Failed to save changes');
    }
  };

  return (
    <div>
      <SectionHeading title="About" subtitle="Add a brief introduction about yourself." />
      <textarea 
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows="10" 
        className="w-full border rounded px-3 py-2" 
        placeholder="Write about yourself..." 
      />
      <button onClick={save} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
        Update Changes
      </button>
    </div>
  );
}

function Education({ profile }) {
  const [entries, setEntries] = useState([]);

  useEffect(()=>{
    if(profile?.education){
      setEntries(profile.education);
    }
  },[profile]);

  const addEntry = () => {
    setEntries((prev) => [...prev, { id: Date.now(), degree: "", school: "", gradeType: "CGPA", score: "", from: {}, to: {} }]);
  };

  const updateEntry = (id, field, value) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  return (
    <div>
      <SectionHeading title="Education" subtitle="Add your education details." />
      <button onClick={addEntry} className="mb-4 text-[#e67829] font-medium">+ Add Education</button>
      <div className="space-y-8">
        {entries.map((edu, idx) => (
          <div key={edu.id} className="border rounded p-4" >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Degree *</label>
                <input value={edu.degree} onChange={(e)=>updateEntry(edu.id,'degree',e.target.value)} className="w-full border rounded px-2 py-1" placeholder="B.Tech" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">School / College *</label>
                <input value={edu.school} onChange={(e)=>updateEntry(edu.id,'school',e.target.value)} className="w-full border rounded px-2 py-1" placeholder="IIT ..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Grade Type</label>
                <select value={edu.gradeType} onChange={(e)=>updateEntry(edu.id,'gradeType',e.target.value)} className="w-full border rounded px-2 py-1">
                  <option>CGPA</option>
                  <option>GPA</option>
                  <option>Percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Score</label>
                <input value={edu.score} onChange={(e)=>updateEntry(edu.id,'score',e.target.value)} className="w-full border rounded px-2 py-1" placeholder="8.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              alert('Please log in again');
              return;
            }

            const res = await fetch('http://localhost:5000/api/users/sections', {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ education: entries }),
            });

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            alert("Education saved successfully");
            // Refresh the profile data to show updated information
            const profileRes = await fetch('http://localhost:5000/api/users/profile', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            const profileData = await profileRes.json();
            if (profileData?.education) {
              setEntries(profileData.education);
            }
          } catch (error) {
            console.error('Error saving education:', error);
            alert('Failed to save education details');
          }
        }}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  );
}

function Achievements({ profile }) {
  const [items,setItems] = useState([]);

  useEffect(()=>{ if(profile?.achievements){setItems(profile.achievements);} },[profile]);

  const addItem=()=>setItems((p)=>[...p,{id:Date.now(),title:"",description:"",url:""}]);
  const update=(id,field,val)=>setItems((p)=>p.map(i=>i.id===id?{...i,[field]:val}:i));
  return (
    <div>
      <SectionHeading title="Achievements" subtitle="Showcase your achievements" />
      <button onClick={addItem} className="mb-4 text-[#e67829] font-medium">+ Add Achievement</button>
      <div className="space-y-8">
        {items.map(item=> (
          <div key={item.id} className="border rounded p-4">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input value={item.title} onChange={(e)=>update(item.id,'title',e.target.value)} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={item.description} onChange={(e)=>update(item.id,'description',e.target.value)} className="w-full border rounded px-2 py-1" rows="3" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input value={item.url} onChange={(e)=>update(item.id,'url',e.target.value)} className="w-full border rounded px-2 py-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              alert('Please log in again');
              return;
            }

            const res = await fetch('http://localhost:5000/api/users/sections', {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ achievements: items }),
            });

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            alert("Achievements saved successfully");
            // Refresh the profile data to show updated information
            const profileRes = await fetch('http://localhost:5000/api/users/profile', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            const profileData = await profileRes.json();
            if (profileData?.achievements) {
              setItems(profileData.achievements);
            }
          } catch (error) {
            console.error('Error saving achievements:', error);
            alert('Failed to save achievements');
          }
        }}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  );
}

function WorkExperience({ profile }) {
  const [jobs,setJobs]=useState([]);

  useEffect(() => {
    if (profile?.work_experience) {
      setJobs(profile.work_experience);
    }
  }, [profile]);

  const add=()=>setJobs(p=>[...p,{id:Date.now(),role:"",company:"",desc:""}]);
  const update=(id,f,v)=>setJobs(p=>p.map(j=>j.id===id?{...j,[f]:v}:j));
  return (
    <div>
      <SectionHeading title="Experience" subtitle="Add your work experience." />
      <button onClick={add} className="mb-4 text-[#e67829] font-medium">+ Add Experience</button>
      <div className="space-y-8">
        {jobs.map(job=> (
          <div key={job.id} className="border rounded p-4">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Description *</label>
                <input value={job.role} onChange={(e)=>update(job.id,'role',e.target.value)} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company *</label>
                <input value={job.company} onChange={(e)=>update(job.id,'company',e.target.value)} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={job.desc} onChange={(e)=>update(job.id,'desc',e.target.value)} className="w-full border rounded px-2 py-1" rows="3" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              alert('Please log in again');
              return;
            }

            const res = await fetch('http://localhost:5000/api/users/sections', {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ workExperience: jobs }),
            });

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            alert("Experience saved successfully");
            // Refresh the profile data to show updated information
            const profileRes = await fetch('http://localhost:5000/api/users/profile', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            const profileData = await profileRes.json();
            if (profileData?.work_experience) {
              setJobs(profileData.work_experience);
            }
          } catch (error) {
            console.error('Error saving work experience:', error);
            alert('Failed to save work experience');
          }
        }}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  );
}

function Platforms({ profile, tokenState }) {
  const initial = [
    { id: "leetcode", label: "LeetCode", url: "", verified: false },
    { id: "codeforces", label: "Codeforces", url: "", verified: false },
    { id: "gfg", label: "GeeksForGeeks", url: "", verified: false },
    { id: "codechef", label: "CodeChef", url: "", verified: false },
    { id: "hackerrank", label: "HackerRank", url: "", verified: false },
  ];

  const [profiles, setProfiles] = useState(initial);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // If profile has platforms data, merge it with initial platforms
      if (profile?.platforms) {
        const mergedProfiles = initial.map(platform => {
          const savedPlatform = profile.platforms.find(p => p.id === platform.id);
          return savedPlatform ? { ...platform, ...savedPlatform } : platform;
        });
        setProfiles(mergedProfiles);
      } else {
        // If no platforms data, use initial state
        setProfiles(initial);
      }
      console.log("Profile data in Platforms:", profile); // Debug log
    } catch (error) {
      console.error("Error processing platforms data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  const [modalOpen, setModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [token, setToken] = useState("");

  const baseUrls = {
    leetcode: "https://leetcode.com/u/",
    codeforces: "https://codeforces.com/profile/",
    gfg: "https://auth.geeksforgeeks.org/user/",
    codechef: "https://www.codechef.com/users/",
    hackerrank: "https://www.hackerrank.com/profile/",
  };

  const update = (id, username) => {
    setProfiles((p) => p.map((pl) => (
      pl.id === id ? { ...pl, url: `${baseUrls[id]}${username}` } : pl
    )));
  };

  const openVerifyModal = async (id) => {
    try {
      const platform = profiles.find((p) => p.id === id);
      if (!platform || !platform.url) {
        throw new Error("Please enter your profile URL first");
      }

      // If user entered only username, build full URL automatically
      let fullUrl = platform.url.trim();
      if (!fullUrl.startsWith("http")) {
        switch (id) {
          case "leetcode":
            fullUrl = `https://leetcode.com/u/${fullUrl}`;
            break;
          case "codeforces":
            fullUrl = `https://codeforces.com/profile/${fullUrl}`;
            break;
          case "gfg":
            fullUrl = `https://auth.geeksforgeeks.org/user/${fullUrl}`;
            break;
          case "codechef":
            fullUrl = `https://www.codechef.com/users/${fullUrl}`;
            break;
          case "hackerrank":
            fullUrl = `https://www.hackerrank.com/profile/${fullUrl}`;
            break;
          default:
            break;
        }
      }

      // Persist constructed URL back into state so user sees it
      setProfiles(p => p.map(pl => pl.id === id ? { ...pl, url: fullUrl } : pl));

      console.log("Initializing verification for platform:", platform);

      let accessToken = tokenState;
      if (!accessToken) {
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
        return;
      }

      const response = await fetch("http://localhost:5000/api/verification/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          platformId: id,
          profileUrl: platform.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error initializing verification");
      }

      const data = await response.json();
      console.log("Verification initialized successfully:", data);

      // Save verification details so the modal & follow-up call can use them
      setToken(data.verificationCode);
      setVerifyTarget(id);
      setModalOpen(true);
    } catch (err) {
      console.error("Verification initialization error:", err);
      alert(err.message || "An unexpected error occurred during verification initialization");
    }
  };

  const verifyPlatformProfile = async (url, verificationCode) => {
    try {
      // Get the platform profile info based on the URL
      let accessToken = tokenState;
      if (!accessToken) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          accessToken = session.access_token;
        } else {
          console.error('No active session found');
          throw new Error('Session expired. Please log in again.');
        }
      }

      console.log('Starting verification with:', {
        profileUrl: url,
        verificationCode
      });

      // Attempt to verify the profile by searching for code on the page
      const res = await fetch('http://localhost:5000/api/verification/confirm', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          platformId: verifyTarget,
          profileUrl: url,
          verificationCode
        }),
      });

      let data;
      try {
        data = await res.json();
        console.log('Verification response:', data);
      } catch (error) {
        console.error('Error parsing verification response:', error);
        throw new Error('Invalid response from verification service');
      }

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Profile not found. Please check your profile URL.');
        } else if (res.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (res.status === 400) {
          throw new Error(data.message || 'Verification failed. Please make sure you have updated your display name.');
        } else {
          throw new Error(data.message || `Verification failed: ${data.error || res.status}`);
        }
      }

      // Validate verification response format
      if (!data || (typeof data.verified === 'undefined' && typeof data.status !== 'string')) {
        throw new Error('Invalid verification response format');
      }

      // Some endpoints return {verified:true}, others {status:'verified'}
      return data.verified === true;
    } catch (error) {
      console.error('Error verifying platform:', error);
      return false;
    }
  };

  const removePlatform = async (platformId) => {
    try {
      const accessToken = tokenState;
      if (!accessToken) {
        alert('Please log in again');
        return;
      }

      const res = await fetch('http://localhost:5000/api/users/platform', {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          platformId
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to remove platform: ${res.status}`);
      }

      // Update local state to reflect the removal
      setProfiles(current => 
        current.map(p => 
          p.id === platformName 
            ? { ...p, verified: false, url: '' }
            : p
        )
      );

      alert('Platform removed successfully');
    } catch (error) {
      console.error('Error removing platform:', error);
      alert('Failed to remove platform');
    }
  };

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
      <SectionHeading title="Platforms" subtitle="Update and verify your platform details here." />

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading platforms...</div>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold mb-2">Problem Solving</h3>
          <div className="space-y-4 max-w-3xl">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-32">{p.label}</span>
            <div className="flex-1 flex">
              <span className="px-2 py-1 border border-r-0 rounded-l bg-gray-100 text-gray-600 text-sm select-none">
                {baseUrls[p.id]}
              </span>
              <input
                value={p.url.replace(baseUrls[p.id], "")}
                onChange={(e) => update(p.id, e.target.value)}
                placeholder="username"
                className="flex-1 border rounded-r px-2 py-1"
              />
            </div>
            {p.verified ? (
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">&#10003;</span>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove your ${p.label} profile?`)) {
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
              <button
                onClick={() => openVerifyModal(p.id)}
                className="bg-blue-600 text-white text-sm px-3 py-1 rounded"
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
            console.log("Saving platforms:", profiles); // Debug log
            const accessToken = tokenState;
            if (!accessToken) {
              alert('Please log in again');
              return;
            }

            const res = await fetch('http://localhost:5000/api/users/sections', {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ platforms: profiles }),
            });

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            alert("Platforms saved successfully");
            // Refresh the profile data to show updated information
            const profileRes = await fetch('http://localhost:5000/api/users/profile', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            });
            const profileData = await profileRes.json();
            if (profileData?.platforms) {
              setProfiles(profileData.platforms);
            }
          } catch (error) {
            console.error('Error saving platforms:', error);
            alert('Failed to save platforms');
          }
        }}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Save
      </button>
        </div>
      )}
      {modalOpen && (
        <VerifyModal code={token} onClose={()=>setModalOpen(false)} onVerify={confirmVerification} />
      )}
    </div>
  );
}

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
    await onVerify();
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-start justify-center z-50" style={{ marginTop: "100px" }}>
      <div ref={modalRef} className="bg-white w-full max-w-md rounded-lg p-6 shadow-xl pointer-events-auto">
        <h3 className="text-lg font-semibold mb-2">Verification Required</h3>
        <div className="space-y-4">
          <p className="text-sm">Follow these steps to verify your profile:</p>
          <ol className="text-sm list-decimal pl-5 space-y-2">
            <li>Go to your profile settings on the platform</li>
            <li>Change your display name to exactly: <span className="font-mono font-bold">{code}</span></li>
            <li>Save the changes on the platform</li>
            <li>Click Verify below</li>
          </ol>
          <p className="text-sm text-gray-600">Note: You can change your display name back after verification is complete.</p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-sm rounded border"
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button 
            id="verifyButton"
            onClick={handleVerify} 
            className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white disabled:bg-blue-400"
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Accounts({ profile }) {
  const [username, setUsername] = useState(profile?.username || "");
  useEffect(()=>{ if(profile){setUsername(profile.username || ""); } },[profile]);
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [photoModal, setPhotoModal] = useState(false);

  const onPhotoChange = () => {
    setPhotoModal(true);
  };

  return (
    <div className="max-w-xl space-y-8">
      <SectionHeading title="Accounts" subtitle="Manage your photo, username and password." />

      {/* Profile photo */}
      <div className="flex items-center gap-6">
        {profile?.photo_url ? (
          <img src={profile.photo_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold border">
            {username ? username.charAt(0).toUpperCase() : "C"}
          </div>
        )}
        <div>
          <label className="block mb-1 text-sm font-medium">Profile Photo</label>
          <button onClick={onPhotoChange} className="px-3 py-1.5 rounded border text-sm">Change Photo</button>
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1">CodeDesk ID (username)</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="your_username"
        />
        <button 
          onClick={async () => {
            try {
              await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sections`, {
                method: "PUT",
                headers: { 
                  "Content-Type": "application/json", 
                  Authorization: `Bearer ${tokenState}` 
                },
                body: JSON.stringify({ username }),
              });
              alert("Username updated successfully");
            } catch (err) {
              alert("Error updating username");
            }
          }}
          className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded text-sm"
        >
          Update Username
        </button>
      </div>

      {/* Password change */}
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">Change Password</label>
        <input
          type="password"
          value={currPass}
          onChange={(e) => setCurrPass(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Current password"
        />
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="New password"
        />
        <input
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          className="w-full border rounded px-3 py-2"
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
                password: newPass
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
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm"
        >
          Update Password
        </button>
      </div>
      {photoModal && (
        <VerifyModal code="Profile photo feature coming soon" onClose={()=>setPhotoModal(false)} onVerify={()=>setPhotoModal(false)} />
      )}
    </div>
  );
}

function VisibilitySection() {
  return (
    <div>
      <SectionHeading title="Visibility" subtitle="Control who sees your profile." />
      <p className="text-gray-500">Visibility settings coming soon...</p>
    </div>
  );
}