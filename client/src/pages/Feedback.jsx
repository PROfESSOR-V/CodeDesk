import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
const subjects = [
    "General feedback",
    "Bug report",
    "Feature request",
    "Account/Billing",
    "Other",
];

export default function FeedbackForm() {
    // simple mount flag to trigger Tailwind utility transitions
    const [mounted, setMounted] = useState(false);
    const [formData, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        // trigger after first render to play transitions
        const t = setTimeout(() => setMounted(true), 20);
        return () => clearTimeout(t);
    }, []);

    const validate = () => {
        const e = {};
        if (!formData.name.trim()) e.name = "Name is required.";
        if (!formData.email.trim()) e.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Enter a valid email.";
        if (!formData.subject) e.subject = "Please select a subject.";
        if (!formData.message.trim()) e.message = "Message is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const authData = JSON.parse(localStorage.getItem("codedesk_auth"));
        if (!authData) throw Error("Login to submit feedback");
        try {
            setSubmitting(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/feedback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authData.access_token}`,
                },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setSubmitted(true);
                setForm({ name: "", email: "", subject: "", message: "" });
                setTimeout(() => setSubmitted(false), 2500);
            }

        } catch (err) {
            console.error("Error submitting feedback: ", err);
        }
        finally {
            setSubmitting(false);
        }
    };

    // shared classes for inputs

    const baseField = "block w-full rounded-lg bg-white dark:bg-gray-800  px-4 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-600 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/60";
    const enter = "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(.22,.61,.36,1)]";
    const fromDown = mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-7 scale-95";

    return (
        <DashboardLayout>
            <main className="flex justify-center items-center bg-gray-50 dark:bg-gray-900">
                <section
                    className={`mx-auto max-w-2xl p-3 md:p-10 ${enter} ${fromDown}`}
                >
                    <h1 className="text-5xl font-bold text-center tracking-tight text-slate-900 dark:text-white">Feedback</h1>
                    <p className="mt-1 max-w-3xl text-center text-slate-500 dark:text-slate-400">
                        We value your feedback and are here to assist you. Please use the formData
                        below to drop your reviews, suggestions, or to ask for support.
                    </p>

                    {submitted && (
                        <div
                            className={`mt-6 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700 ${enter} ${fromDown}`}
                        >
                            Thank you! Your feedback has been submitted.
                        </div>
                    )}

                    <form onSubmit={onSubmit} noValidate className="mt-3 grid gap-2">
                        {/* Name */}
                        <div className={`${enter} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                            <label htmlFor="name" className="mb-1 block text-sm dark:text-slate-400 font-medium">Name</label>
                            <input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={onChange}
                                placeholder="Your name"
                                autoComplete="name"
                                className={`${baseField} ${errors.name ? "ring-red-300" : ""}`}
                            />
                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div className={`${enter} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                            <label htmlFor="email" className="mb-1 block dark:text-slate-400 text-sm font-medium">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={onChange}
                                placeholder="you@example.com"
                                autoComplete="email"
                                className={`${baseField} ${errors.email ? "ring-red-300" : ""}`}
                            />
                            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Subject */}
                        <div className={`${enter} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                            <label htmlFor="subject" className="mb-1 block dark:text-slate-400 text-sm font-medium">Subject</label>
                            <div className="relative">
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={onChange}
                                    className={`${baseField} appearance-none pr-10 ${errors.subject ? "ring-red-300" : ""}`}
                                >
                                    <option value="">Select subject</option>
                                    {subjects.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <span className="pointer-events-none absolute text-sm right-3 top-1/2 -translate-y-1/2 text-slate-400">▼</span>
                            </div>
                            {errors.subject && <p className=" text-sm text-red-600">{errors.subject}</p>}
                        </div>

                        {/* Message */}
                        <div className={`${enter} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                            <label htmlFor="message" className="mb-1 block dark:text-slate-400 text-sm font-medium">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows={3}
                                value={formData.message}
                                onChange={onChange}
                                placeholder="Write your message..."
                                className={`${baseField} resize-y ${errors.message ? "ring-red-300" : ""}`}
                            />
                            {errors.message && <p className=" text-sm text-red-600">{errors.message}</p>}
                        </div>

                        {/* Submit */}
                        <div className={`${enter} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center rounded-lg bg-blue-500 px-5 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 disabled:opacity-60"
                            >
                                {submitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </DashboardLayout>
    );
}
