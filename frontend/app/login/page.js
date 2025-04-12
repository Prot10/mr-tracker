"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/my-input";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const token = data.session.access_token;
      const response = await fetch(`${BACKEND_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const categories = await response.json();
        if (categories && categories.length > 0) {
          router.push("/homepage");
        } else {
          alert(
            "It looks like you haven't completed onboarding. Please complete onboarding to continue."
          );
          router.push("/onboarding");
        }
      } else {
        setError("Failed to fetch categories. Please try again later.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg p-8">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image
              src="/mr-tracker.svg"
              alt="Mr Tracker Logo"
              width={120}
              height={120}
              className="cursor-pointer"
            />
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Login
        </h1>
        {loading && (
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg
              className="animate-spin h-6 w-6 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span className="text-white">Please wait...</span>
          </div>
        )}
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="mb-4">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="example@domain.com"
            />
          </div>
          <div className="mb-8">
            <Label htmlFor="password" className="text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="MrTracker2025"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-semibold rounded-md transition mb-8"
          >
            Login
          </button>
        </form>
        <p className="text-center text-gray-400">
          Don&apos;t have an account yet?{" "}
          <span
            className="text-indigo-500 cursor-pointer"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
