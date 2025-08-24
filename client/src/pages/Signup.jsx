import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import anime from "animejs";
import BrandName from "../components/BrandName.jsx";
import { supabase } from "../supabaseClient.js";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const formRef = useRef(null);
  const featureRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    const conditions = [
      { text: "At least 8 characters long", met: password.length >= 8 },
      { text: "Contains at least one uppercase letter", met: /[A-Z]/.test(password) },
      { text: "Contains at least one lowercase letter", met: /[a-z]/.test(password) },
      { text: "Contains at least one number", met: /[0-9]/.test(password) },
      { text: "Contains at least one special character", met: /[^A-Za-z0-9]/.test(password) },
    ];
    const score = conditions.filter(c => c.met).length;
    return { score, conditions };
  };

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

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setError("Please fill in all fields");
      return;
    }

    const { score } = checkPasswordStrength(password);
    if (score < 5) {
      setError("Password does not meet all security requirements.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            first_name: name.split(' ')[0],
            last_name: name.split(' ')[1] || ''
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.session?.access_token) {
        localStorage.setItem("token", data.session.access_token);
        navigate("/dashboard");
      } else {
        setError('Please check your email to confirm your account');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div ref={formRef} className="w-full max-w-md space-y-6">
          <h2 className="text-3xl font-bold mb-2">
            Create your <BrandName /> account
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#e67829] dark:bg-gray-800 dark:border-gray-700"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#e67829] dark:bg-gray-800 dark:border-gray-700"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  const newPassword = e.target.value;
                  setPassword(newPassword);
                  const { score, conditions } = checkPasswordStrength(newPassword);
                  setPasswordScore(score);
                  setPasswordRequirements(conditions);
                }}
                className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#e67829] dark:bg-gray-800 dark:border-gray-700"
                placeholder="Create password"
              />
              {password && (
                <div className="mt-2 text-sm space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className={`flex items-center gap-2 ${req.met ? "text-green-500" : "text-gray-500"}`}>
                      {req.met ? <span className="text-green-500">✓</span> : <span className="text-gray-400">✗</span>}
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-sm text-[#e67829] hover:underline"
                >
                  {showPassword ? "Hide" : "Show"} password
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignup}
              disabled={isLoading}
              className="w-full bg-[#e67829] text-white py-2 rounded shadow hover:bg-[#e67829]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing up..." : "Sign up"}
            </button>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Already have an account?</span>
            <Link to="/login" className="text-[#e67829] font-medium hover:underline">
              Sign in here
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <hr className="flex-1 border-gray-300 dark:border-gray-700" />
            <span className="text-gray-400 text-sm">Or continue with</span>
            <hr className="flex-1 border-gray-300 dark:border-gray-700" />
          </div>
          <button className="w-full border py-2 rounded flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FcGoogle size={20} /> Sign up with Google
          </button>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            By signing up, you agree to our <span className="text-[#e67829]">Terms &amp; Conditions</span> and <span className="text-[#e67829]">Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* Feature side */}
      <div className="hidden lg:flex flex-1 bg-[#e67829] text-white px-12 py-16 flex-col justify-center gap-12">
        <h2 className="text-4xl font-extrabold leading-tight mb-6">Welcome to <BrandName className="inline" variant="white" /></h2>
        <div ref={featureRef} className="space-y-10 text-lg">
          <div>
            <h3 className="font-semibold text-xl mb-1">Track Your Journey</h3>
            <p className="opacity-90 text-sm">Monitor your coding progress and stay motivated with detailed analytics.</p>
          </div>
          <div>
            <h3 className="font-semibold text-xl mb-1">Sharpen Your Skills</h3>
            <p className="opacity-90 text-sm">Access curated sheets and challenges to push your boundaries every day.</p>
          </div>
          <div>
            <h3 className="font-semibold text-xl mb-1">Join the Community</h3>
            <p className="opacity-90 text-sm">Collaborate and share milestones with peers who code.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
