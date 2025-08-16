import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import anime from "animejs";
// Your import (causing the error)
import { ThemeContext } from '/src/context/ThemeContext.jsx';

import BrandName from "../components/BrandName.jsx";
import { useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function Login() {
  const formRef = useRef(null);
  const navigate = useNavigate();
  const featureRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (formRef.current) {
      anime({
        targets: formRef.current.querySelectorAll("input, button"),
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        duration: 700,
        easing: "easeOutQuad",
      });
    }

    if (featureRef.current) {
      anime({
        targets: featureRef.current.children,
        opacity: [0, 1],
        translateX: [50, 0],
        delay: anime.stagger(150),
        duration: 800,
        easing: "easeOutQuad",
      });
    }
  }, []);

  function handleLogin() {
    setError(null);
    setIsLoading(true);

    supabase.auth
      .signInWithPassword({ email, password })
      .then(async ({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          const user = data?.user;
          if (user) {
            try {
              const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/sync`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${data.session.access_token}`
                },
                body: JSON.stringify({ supabaseId: user.id, email: user.email, name: user.user_metadata?.name || "" }),
              });

              if (!res.ok) {
                console.warn("/api/users/sync returned", res.status);
              }
            } catch (syncErr) {
              console.error("Sync failed", syncErr);
            }
            navigate("/dashboard");
        } else {
          setError("User not found after successful sign-in.");
        }
      }
    })
      .catch((err) => {
      console.error("Login failed:", err);
      setError(err.message);
    })
    .finally(() => {
      setIsLoading(false); 
    });
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div ref={formRef} className="w-full max-w-md space-y-6">
          <h2 className="text-3xl font-bold">
            Sign in to <BrandName />
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#e67829]"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#e67829]"
                placeholder="Enter password"
              />
              <div className="text-right mt-1">
                <button className="text-sm text-[#e67829] hover:underline">Forgot password?</button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-[#e67829] text-white py-2 rounded shadow hover:bg-[#e67829]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Don&apos;t have an account?</span>
            <Link to="/signup" className="text-[#e67829] font-medium hover:underline">
              Sign up here
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <hr className="flex-1" />
            <span className="text-gray-400 text-sm">Or continue with</span>
            <hr className="flex-1" />
          </div>
          <button className="w-full border py-2 rounded flex items-center justify-center gap-2 hover:bg-gray-50">
            <FcGoogle size={20} /> Sign in with Google
          </button>
          <p className="text-xs text-center text-gray-400">
            By signing in or creating an account, you agree to our <span className="text-[#e67829]">Terms &amp; Conditions</span>
            {" "}and our <span className="text-[#e67829]">Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* Feature side */}
      <div className="hidden lg:flex flex-1 bg-[#e67829] text-white px-12 py-16 flex-col justify-center gap-12">
        <h2 className="text-4xl font-extrabold leading-tight mb-6">Welcome to <BrandName className="inline" variant="white" /></h2>
        <div ref={featureRef} className="space-y-10 text-lg">
          <div>
            <h3 className="font-semibold text-xl mb-1">All in One Coding Profile</h3>
            <p className="opacity-90 text-sm">
              Showcase your complete coding portfolio, track all stats, and share your progress effortlessly in one place.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-xl mb-1">Follow Popular Sheets</h3>
            <p className="opacity-90 text-sm">
              Organize questions, notes, and follow popular coding sheets in one place for seamless review and effective revision.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-xl mb-1">Contest Tracker</h3>
            <p className="opacity-90 text-sm">
              Stay on top of coding contests by tracking schedules and setting reminders effortlessly with a single click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 