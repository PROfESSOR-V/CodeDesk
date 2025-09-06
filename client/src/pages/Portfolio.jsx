import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import DashboardLayout from "../components/DashboardLayout";
import ContributionHeatmap from "../components/ContributionHeatmap";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

// Platform icons mapping
const platformIcons = {
    leetcode: "/src/assests/leetcode-logo.png",
    codeforces: "/src/assests/codeforces-logo.png",
    gfg: "/src/assests/gfg-logo.png",
    codechef: "/src/assests/codechef-logo.jpeg",
    hackerrank: "/src/assests/hackerrank-logo.jpeg",
};

const EMPTY_PORTFOLIO = {
    user: {},
    verifiedPlatforms: [],
    aggregatedStats: {
        totalQuestions: 0,
        totalActiveDays: 0,
        totalRating: 0,
        totalContests: 0,
        problemDifficulty: { easy: 0, medium: 0, hard: 0 },
    },
    unifiedActivity: [],
    contestRatings: [],
    awards: [],
    dsaTopics: {},
    contributionData: {},
};

const Portfolio = () => {
    const [portfolioData, setPortfolioData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showGetCardModal, setShowGetCardModal] = useState(false);
    const [profile, setProfile] = useState(null);
    const [authEmail, setAuthEmail] = useState("");
    const [codeforcesData, setCodeforcesData] = useState(null);
    const [codechefData, setCodechefData] = useState(null);

    // Test function to manually trigger CodeChef data fetch
    // const testCodeChefFetch = async () => {
    //     const testUsername = "potato167"; // Replace with test username
    //     const baseUrl = `${
    //         import.meta.env.VITE_API_URL || "http://localhost:5000"
    //     }/api/codechef`;

    //     try {
    //         const [profileRes, heatmapRes, activitiesRes] = await Promise.all([
    //             fetch(`${baseUrl}/profile/${testUsername}`),
    //             await fetch(`${baseUrl}/profile/${testUsername}/heatmap`),
    //             await fetch(`${baseUrl}/profile/${testUsername}/activities`),
    //         ]);

    //         const results = {};

    //         if (profileRes.ok) {
    //             const data = await profileRes.json();
    //             results.profile = data.success ? data.profile : null;
    //         }

    //         if (heatmapRes.ok) {
    //             const data = await heatmapRes.json();
    //             results.heatmap = data.success ? data.heatmap : [];
    //         }

    //         if (activitiesRes.ok) {
    //             const data = await activitiesRes.json();
    //             results.activities = data.success ? data.activities : null;
    //         }

    //         console.log("TEST: CodeChef data fetched:", results);
    //         setCodechefData(results);
    //     } catch (error) {
    //         console.error("TEST: Error fetching CodeChef data:", error);
    //     }
    // };

    // Trigger GFG scraper on each page load/refresh if user has verified GFG profile
    useEffect(() => {
        (async () => {
            if (!portfolioData) return;
            const gfgPlat = (portfolioData.verifiedPlatforms || []).find(
                (p) => p.id === "gfg" && p.verified
            );
            if (!gfgPlat) return;

            // Derive clean username from URL
            let username;
            try {
                const url = new URL(
                    gfgPlat.url.startsWith("http")
                        ? gfgPlat.url
                        : `https://auth.geeksforgeeks.org/user/${gfgPlat.url}`
                );
                const segs = url.pathname.split("/").filter(Boolean);
                username = segs[segs.length - 1].split("?")[0].split("#")[0];
            } catch {
                const parts = gfgPlat.url.split("/").filter(Boolean);
                username = parts[parts.length - 1].split("?")[0].split("#")[0];
            }
            if (!username) return;

            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user?.id) return;

            try {
                await fetch("https://gfg-scraper-jns7.onrender.com/scrape", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, supabase_id: user.id }),
                });
                // Optionally re-fetch portfolio after scrape completes (delay 3s)
                setTimeout(fetchPortfolioData, 3000);
            } catch (err) {
                console.error("GFG auto-trigger failed:", err);
            }
        })();
    }, [portfolioData]);

    useEffect(() => {
        // Load portfolio (may be empty) and user profile in parallel
        fetchPortfolioData();
        fetchUserProfile();
        fetchCodeforcesData();
    }, []);

    useEffect(() => {
        if (portfolioData) {
            fetchCodeChefData();
        }
    }, [portfolioData]);

    const fetchPortfolioData = async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                console.log("No session found");
                setPortfolioData(EMPTY_PORTFOLIO);
                return;
            }
            setAuthEmail(session.user?.email || "");

            console.log("Fetching portfolio data...");
            const response = await fetch(
                `${
                    import.meta.env.VITE_API_URL || "http://localhost:5000"
                }/api/users/portfolio`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Portfolio response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("Portfolio data received:", data);
                // normalise fields for UI components
                if (data?.aggregatedStats) {
                    const agg = data.aggregatedStats;
                    const totalRating = Array.isArray(agg.totalRating)
                        ? agg.totalRating.reduce(
                              (n, r) => n + (parseInt(r.rating) || 0),
                              0
                          )
                        : agg.totalRating || 0;
                    
                    data.aggregatedStats = {
                        ...agg,
                        totalRating: totalRating,
                        totalActiveDays: data.unifiedActivity?.length || 0,
                        problemDifficulty: {
                            easy: agg.easy ?? 0,
                            medium: agg.medium ?? 0,
                            hard: agg.hard ?? 0,
                        },
                    };
                }
                console.log("Aggregated Stats : ",data)
                setPortfolioData(data || EMPTY_PORTFOLIO);
            } else {
                try {
                    const errorData = await response.text();
                    console.error(
                        "Portfolio fetch error:",
                        response.status,
                        errorData
                    );
                } catch {}
                setPortfolioData(EMPTY_PORTFOLIO);
            }
        } catch (error) {
            console.error("Error fetching portfolio data:", error);
            setPortfolioData(EMPTY_PORTFOLIO);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                setProfile(null);
                return;
            }
            setAuthEmail((prev) => prev || session.user?.email || "");
            const resp = await fetch(
                `${
                    import.meta.env.VITE_API_URL || "http://localhost:5000"
                }/api/users/profile`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (resp.ok) {
                const data = await resp.json();
                setProfile(data || null);
            } else {
                setProfile(null);
            }
        } catch (err) {
            console.error("Profile fetch failed", err);
            setProfile(null);
        }
    };

    const fetchCodeforcesData = async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                `${
                    import.meta.env.VITE_API_URL || "http://localhost:5000"
                }/api/codeforces/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.ok) {
                const result = await response.json();
                // Extract the actual data from the nested response structure
                const data = result.success ? result.data : result;
                setCodeforcesData(data);
                console.log("Codeforces data fetched:", data);
            } else if (response.status === 404) {
                // No Codeforces profile found - this is normal if user hasn't added one yet
                setCodeforcesData(null);
                console.log("No Codeforces profile found for user");
            } else {
                setCodeforcesData(null);
                console.error(
                    "Failed to fetch Codeforces data:",
                    response.status
                );
            }
        } catch (error) {
            console.error("Error fetching Codeforces data:", error);
            setCodeforcesData(null);
        }
    };

    const fetchCodeChefData = async () => {
        try {
            // TESTING: Bypass verification check
            const username = "potato167"; // Replace with actual username

            // Get user's CodeChef username from profile
            const profile = portfolioData?.verifiedPlatforms?.find(
                (p) => p.id === "codechef"
            );

            if (!profile?.verified) console.log("verified :", portfolioData?.verifiedPlatforms);

            const baseUrl = `${
                import.meta.env.VITE_API_URL || "http://localhost:5000"
            }/api/codechef`;

            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    console.log("No session found for CodeChef fetch");
                    return;
                }

                const { data: userData } = await supabase
                    .from("codechef_profiles")
                    .select("updated_at")
                    .eq("supabase_id", user.id)
                    .single();

                if (isFiveHourAfter(userData?.updated_at)) {
                    const response = await fetch(`${baseUrl}/scrape`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${user.access_token}`,
                        },
                        body: JSON.stringify({
                            username: username,
                            supabase_id: user.id, // This is the UID
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log("CodeChef scrape triggered");
                    } else {
                        const errorData = await response.text();
                        console.error("CodeChef scrape trigger failed");
                    }
                }
            } catch (error) {
                console.log("TEST: Error in fetchCodeChefData",error);
            }

            console.log("fetch triggered")
            // Fetch all CodeChef data in parallel
            const [profileRes, heatmapRes, activitiesRes] = await Promise.all([
                fetch(`${baseUrl}/profile/${username}`),
                fetch(`${baseUrl}/profile/${username}/heatmap`),
                fetch(`${baseUrl}/profile/${username}/activities`),
            ]);

            const results = {};

            if (profileRes.ok) {
                const data = await profileRes.json();
                results.profile = data.success ? data.profile : null;
            }

            if (heatmapRes.ok) {
                const data = await heatmapRes.json();
                results.heatmap = data.success ? data.heatmap : [];
            }

            if (activitiesRes.ok) {
                const data = await activitiesRes.json();
                results.activities = data.success ? data.activities : null;
            }

            console.log("CodeChef data fetched");
            setCodechefData(results);
            return results;
        } catch (error) {
            console.error("Error fetching CodeChef data:", error);
            return null;
        }
    };

    //Helper function
    function isFiveHourAfter(scrapedTime){
        const oldTime = new Date(scrapedTime).getTime()
        const currentTime = new Date(Date.now()).getTime()
        const fiveHour = 5*60*60*1000

        return currentTime >= oldTime + fiveHour
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    // No platforms connected view
    console.log("Portfolio data check:", portfolioData);
    console.log("Verified platforms:", portfolioData?.verifiedPlatforms);
    console.log(
        "Verified platforms length:",
        portfolioData?.verifiedPlatforms?.length
    );
    console.log("Condition result:", !portfolioData?.verifiedPlatforms?.length);

    if (!portfolioData?.verifiedPlatforms?.length) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-16">
                            {/* TEST BUTTON - Remove in production
                            <button
                                onClick={testCodeChefFetch}
                                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2 rounded mb-4 transition-all duration-150 transform active:scale-95 hover:shadow-lg"
                            >
                                Test CodeChef Fetch
                            </button> */}
                            <div className="mb-8">
                                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <svg
                                        className="w-12 h-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Connect Your Coding Platforms
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Link your coding profiles to showcase your
                                    programming journey and achievements in one
                                    place.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 max-w-2xl mx-auto">
                                {Object.entries(platformIcons).map(
                                    ([platform, icon]) => (
                                        <div
                                            key={platform}
                                            className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                        >
                                            <img
                                                src={icon}
                                                alt={platform}
                                                className="w-12 h-12 mb-2 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700 capitalize">
                                                {platform}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>

                            <button
                                onClick={() =>
                                    (window.location.href = "/profile/edit")
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                Connect Platforms
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Always render the page; fall back to EMPTY_PORTFOLIO if data missing
    const safeData = portfolioData || EMPTY_PORTFOLIO;
    const verifiedFromProfile = (profile?.platforms || [])
        .filter((p) => p.verified)
        .map((p) => ({ platform: p.id }));
        
    const userForCard = {
        username: profile?.username || "",
        fullName:
            profile?.full_name ||
            `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
        email: authEmail,
        profilePicture: profile?.avatar_url,
        country: profile?.country,
        college: profile?.college,
        linkedinUrl: profile?.linkedin_url,
        twitterUrl: profile?.twitter_url,
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Profile Card */}
                        <div className="lg:col-span-1">
                            <ProfileCard
                                user={userForCard}
                                verifiedPlatforms={verifiedFromProfile}
                                onGetCard={() => setShowGetCardModal(true)}
                            />
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Top Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TotalQuestionsCard
                                    stats={safeData.aggregatedStats || {}}
                                />
                                <ActiveDaysCard
                                    stats={safeData.aggregatedStats || {}}
                                />
                            </div>

                            {/* Contribution Heatmap */}
                            <ContributionHeatmap
                                activity={safeData.unifiedActivity || []}
                            />

                            {/* Contest Card */}
                            <ContestCard
                                contestData={safeData.contestRatings || []}
                                totalContests={
                                    safeData.aggregatedStats?.totalContests || 0
                                }
                            />

                            {/* Rating and Problem Summary */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <RatingCard
                                    stats={safeData.aggregatedStats || {}}
                                />
                                <ProblemSummaryCard
                                    stats={safeData.aggregatedStats || {}}
                                />
                            </div>

                            {/* Contest Rating */}
                            <ContestRatingCard
                                contestRatings={safeData.contestRatings || []}
                            />

                            {/* Codeforces Profile */}
                            {codeforcesData && (
                                <CodeforcesProfileCard
                                    codeforcesData={codeforcesData}
                                />
                            )}

                            {/* Awards */}
                            <AwardsCard awards={safeData.awards || []} />

                            {/* DSA Analysis */}
                            <DSAAnalysisCard
                                dsaTopics={safeData.dsaTopics || {}}
                            />
                        </div>
                    </div>
                </div>

                {/* Get Card Modal */}
                {showGetCardModal && (
                    <GetCardModal onClose={() => setShowGetCardModal(false)} />
                )}
            </div>
        </DashboardLayout>
    );
};

// Profile Card Component
const ProfileCard = ({ user, verifiedPlatforms, onGetCard }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                {user.profilePicture ? (
                    <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                            className="w-12 h-12"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center mb-2">
                <span className="text-sm text-gray-600">@{user.username}</span>
                <svg
                    className="w-4 h-4 text-green-500 ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
                {user.fullName || user.username}
            </h3>
        </div>

        <button
            onClick={onGetCard}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-md font-medium mb-6 transition-colors"
        >
            Get Card
        </button>

        {/* Social Links */}
        <div className="flex justify-center space-x-4 mb-6">
            <a
                href={`mailto:${user.email}`}
                className="text-gray-400 hover:text-gray-600"
            >
                <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
            </a>
            {user.linkedinUrl && (
                <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600"
                >
                    <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                            clipRule="evenodd"
                        />
                    </svg>
                </a>
            )}
            {user.twitterUrl && (
                <a
                    href={user.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400"
                >
                    <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                </a>
            )}
        </div>

        {/* User Info */}
        <div className="space-y-2 text-sm text-gray-600 mb-6">
            {user.country && (
                <div className="flex items-center">
                    <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {user.country}
                </div>
            )}
            {user.college && (
                <div className="flex items-center">
                    <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z" />
                    </svg>
                    {user.college}
                </div>
            )}
        </div>

        {/* Verified Platforms */}
        <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
                Problem Solving Stats
            </h4>
            <div className="text-center p-4 bg-gray-50 rounded-md mb-4">
                <div className="text-xs text-gray-500 mb-1">About</div>
                <div className="text-xs text-gray-500 mb-4">
                    Problem Solving Stats ▲
                </div>

                {verifiedPlatforms.map((platform) => (
                    <div
                        key={platform.platform}
                        className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0"
                    >
                        <div className="flex items-center">
                            <div className="w-4 h-4 mr-2">
                                <img
                                    src={platformIcons[platform.platform]}
                                    alt={platform.platform}
                                    className="w-full h-full rounded"
                                />
                            </div>
                            <span className="text-sm capitalize">
                                {platform.platform}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <svg
                                className="w-4 h-4 text-green-500 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Stats Cards Components
const TotalQuestionsCard = ({ stats }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">
                    Total Questions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                    {stats.totalQuestions || 0}
                </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>
        </div>
    </div>
);

const ActiveDaysCard = ({ stats }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">Active Days</p>
                <p className="text-3xl font-bold text-gray-900">
                    {stats.totalActiveDays || 0}
                </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
        </div>
    </div>
);

const ContributionGraphCard = ({
    contributionData,
    unifiedActivity = [],
    selectedYear,
    onYearChange,
}) => {
    console.log(
        "Unified activity length",
        unifiedActivity.length,
        unifiedActivity.slice(0, 5)
    );
    const firstGraph = Object.values(contributionData)[0];
    const graphHtml = firstGraph?.html || null;

    const startDate = new Date(`${selectedYear}-01-01`);
    const endDate = new Date(`${selectedYear}-12-31`);

    // Build complete dataset for the selected year (fill missing days with 0 submissions)
    const activityMap = new Map(
        unifiedActivity.map(({ date, count }) => [date, count])
    );
    const tempData = [];
    for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
    ) {
        const isoDate = d.toISOString().slice(0, 10);
        tempData.push({ date: isoDate, count: activityMap.get(isoDate) || 0 });
    }
    const heatmapData = tempData;
    console.log("Heatmap data for year", selectedYear, heatmapData.length);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-700 font-medium">
                    {/* submissions/ streak counters will be inside the SVG html */}
                </div>
                <select
                    value={selectedYear}
                    onChange={(e) => onYearChange(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-md px-2 py-0.5 text-sm"
                >
                    {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() + 1 - i;
                        return (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div
                className="overflow-x-auto scrollbar-thin"
                style={{ maxHeight: "170px" }}
            >
                <CalendarHeatmap
                    startDate={startDate}
                    endDate={endDate}
                    values={heatmapData}
                    classForValue={(value) => {
                        if (!value || value.count === 0)
                            return "color-github-0";
                        if (value.count >= 10) return "color-github-4";
                        if (value.count >= 7) return "color-github-3";
                        if (value.count >= 4) return "color-github-2";
                        return "color-github-1";
                    }}
                    tooltipDataAttrs={(value) =>
                        value?.date
                            ? {
                                  "data-tip": `${value.date}: ${value.count} submissions`,
                              }
                            : {}
                    }
                />
            </div>
        </div>
    );
};

const ContestCard = ({ contestData, totalContests }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
            Contest Participation
        </h3>
        <div className="text-center mb-4">
            <p className="text-3xl font-bold text-gray-900">{totalContests}</p>
            <p className="text-sm text-gray-600">Total Contests</p>
        </div>
        <div className="flex justify-center space-x-2">
            {contestData.map((contest, index) => (
                <img
                    key={index}
                    src={platformIcons[contest.platform]}
                    alt={contest.platform}
                    className="w-6 h-6 rounded"
                />
            ))}
        </div>
    </div>
);

const RatingCard = ({ stats }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Total Rating</h3>
        <p className="text-3xl font-bold text-gray-900">
            {stats.totalRating || 0}
        </p>
        <p className="text-sm text-gray-600">Across all platforms</p>
    </div>
);

const ProblemSummaryCard = ({ stats }) => {
    const data = [
        {
            label: "Easy",
            value: stats.problemDifficulty?.easy || 0,
            color: "#22c55e",
        },
        {
            label: "Medium",
            value: stats.problemDifficulty?.medium || 0,
            color: "#facc15",
        },
        {
            label: "Hard",
            value: stats.problemDifficulty?.hard || 0,
            color: "#ef4444",
        },
    ];
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Problem Difficulty Breakdown
            </h3>
            <div className="flex items-center justify-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                    {/* background circle */}
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="18"
                    />
                    {data.map((d, idx) => {
                        const dashArray =
                            total === 0 ? 0 : (d.value / total) * circumference;
                        const dashOffset = circumference - accumulated;
                        accumulated += dashArray;
                        return (
                            <circle
                                key={idx}
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="none"
                                stroke={d.color}
                                strokeWidth="18"
                                strokeDasharray={`${dashArray} ${
                                    circumference - dashArray
                                }`}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="butt"
                            />
                        );
                    })}
                </svg>
            </div>
            <div className="mt-4 space-y-1 text-sm">
                {data.map((d) => (
                    <div
                        key={d.label}
                        className="flex items-center justify-between"
                    >
                        <span className="flex items-center">
                            <span
                                className="w-3 h-3 inline-block mr-2 rounded-full"
                                style={{ backgroundColor: d.color }}
                            ></span>
                            {d.label}
                        </span>
                        <span className="font-medium">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ContestRatingCard = ({ contestRatings }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
            Contest Rating
        </h3>
        <div className="space-y-3">
            {contestRatings.map((rating, index) => (
                <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                        <img
                            src={platformIcons[rating.platform]}
                            alt={rating.platform}
                            className="w-6 h-6 mr-2 rounded"
                        />
                        <span className="capitalize font-medium">
                            {rating.platform}
                        </span>
                    </div>
                    <span className="font-bold">{rating.rating}</span>
                </div>
            ))}
        </div>
    </div>
);

const AwardsCard = ({ awards }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Awards</h3>
        {awards.length > 0 ? (
            <div className="space-y-2">
                {awards.map((award, index) => (
                    <div key={index} className="flex items-center">
                        <img
                            src={platformIcons[award.platform]}
                            alt={award.platform}
                            className="w-6 h-6 mr-2 rounded"
                        />
                        <span className="text-sm">
                            {award.badges.length + award.achievements.length}{" "}
                            awards
                        </span>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-gray-500">No awards yet</p>
        )}
    </div>
);

const DSAAnalysisCard = ({ dsaTopics }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
            DSA Topic Analysis
        </h3>
        <div className="space-y-3">
            {Object.entries(dsaTopics).map(([topic, count], index) => {
                const colors = [
                    "bg-purple-500",
                    "bg-green-500",
                    "bg-yellow-500",
                    "bg-red-500",
                    "bg-indigo-500",
                    "bg-pink-500",
                    "bg-orange-500",
                    "bg-teal-500",
                    "bg-cyan-500",
                    "bg-lime-500",
                ];
                const maxCount = Math.max(...Object.values(dsaTopics));
                const width = (count / maxCount) * 100;

                return (
                    <div key={topic} className="flex items-center">
                        <div className="w-24 text-sm text-gray-600 truncate">
                            {topic}
                        </div>
                        <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${
                                    colors[index % colors.length]
                                }`}
                                style={{ width: `${width}%` }}
                            ></div>
                        </div>
                        <div className="w-8 text-sm font-medium text-gray-900">
                            {count}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const GetCardModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-mx-4">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Coming Soon!
                </h3>
                <p className="text-gray-600 mb-6">
                    Portfolio cards feature is under development. Stay tuned for
                    updates!
                </p>
                <button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
);

// Codeforces Profile Card Component
const CodeforcesProfileCard = ({ codeforcesData }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <img
                    src="/src/assests/codeforces-logo.png"
                    alt="Codeforces"
                    className="w-8 h-8"
                />
                <h3 className="text-xl font-bold text-gray-900">
                    Codeforces Profile
                </h3>
            </div>
            <span className="text-sm text-gray-500">
                Last updated:{" "}
                {new Date(
                    codeforcesData.last_refreshed_at
                ).toLocaleDateString()}
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Stats */}
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Handle</span>
                    <span className="font-bold text-blue-600">
                        {codeforcesData.handle}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">
                        Current Rating
                    </span>
                    <span className="font-bold text-green-600">
                        {codeforcesData.rating || "Unrated"}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">
                        Max Rating
                    </span>
                    <span className="font-bold text-purple-600">
                        {codeforcesData.max_rating || "Unrated"}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Rank</span>
                    <span className="font-bold text-orange-600">
                        {codeforcesData.rank || "Unrated"}
                    </span>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">
                        Contribution
                    </span>
                    <span className="font-bold text-blue-600">
                        {codeforcesData.contribution || 0}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Friends</span>
                    <span className="font-bold text-green-600">
                        {codeforcesData.friend_of_count || 0}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Contests</span>
                    <span className="font-bold text-purple-600">
                        {codeforcesData.contest_history
                            ? codeforcesData.contest_history.length
                            : 0}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">
                        Problems Solved
                    </span>
                    <span className="font-bold text-orange-600">
                        {codeforcesData.submission_stats?.accepted || 0}
                    </span>
                </div>
            </div>
        </div>

        {/* Activity Heatmap */}
        {codeforcesData.activity_data &&
            codeforcesData.activity_data.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Submission Activity
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <ContributionHeatmap
                            activity={codeforcesData.activity_data}
                        />
                    </div>
                </div>
            )}

        {/* Language Stats */}
        {codeforcesData.language_stats &&
            Object.keys(codeforcesData.language_stats).length > 0 && (
                <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Programming Languages
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(codeforcesData.language_stats)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 6)
                            .map(([language, count]) => (
                                <div
                                    key={language}
                                    className="bg-blue-50 p-3 rounded-lg text-center"
                                >
                                    <div className="font-bold text-blue-600">
                                        {count}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {language}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

        {/* Problem Tags */}
        {codeforcesData.tag_stats &&
            Object.keys(codeforcesData.tag_stats).length > 0 && (
                <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Problem Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(codeforcesData.tag_stats)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10)
                            .map(([tag, count]) => (
                                <span
                                    key={tag}
                                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                                >
                                    {tag} ({count})
                                </span>
                            ))}
                    </div>
                </div>
            )}
    </div>
);

export default Portfolio;
