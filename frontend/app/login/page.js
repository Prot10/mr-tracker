"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/my-input";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      toast.error("Login Failed", {
        description: error.message || "Invalid email or password",
      });
      setLoading(false);
      return;
    }

    try {
      const token = data.session.access_token;
      const response = await fetch(`${BACKEND_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const categories = await response.json();

      if (categories?.length > 0) {
        router.push("/homepage");
      } else {
        toast.warning("Onboarding Required", {
          description: "Please complete onboarding to continue",
          action: {
            label: "Go to Onboarding",
            onClick: () => router.push("/onboarding"),
          },
        });
        router.push("/onboarding");
      }
    } catch (err) {
      toast.error("Login Error", {
        description: err.message || "An error occurred during login",
      });
      setLoading(false);
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
            <svg width="60" height="60" viewBox="0 0 50 50">
              <g fill="none" stroke="#60A5FA">
                <g transform="rotate(0 25 25)">
                  <ellipse
                    cx="25"
                    cy="25"
                    rx="15"
                    ry="8"
                    strokeWidth="2"
                    opacity="0.3"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 25 25"
                      to="360 25 25"
                      dur="3s"
                      repeatCount="indefinite"
                    ></animateTransform>
                  </ellipse>
                </g>
                <g transform="rotate(120 25 25)">
                  <ellipse
                    cx="25"
                    cy="25"
                    rx="15"
                    ry="8"
                    strokeWidth="2"
                    opacity="0.5"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 25 25"
                      to="360 25 25"
                      dur="4s"
                      repeatCount="indefinite"
                    ></animateTransform>
                  </ellipse>
                </g>
                <g transform="rotate(240 25 25)">
                  <ellipse
                    cx="25"
                    cy="25"
                    rx="15"
                    ry="8"
                    strokeWidth="2"
                    opacity="0.7"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 25 25"
                      to="360 25 25"
                      dur="5s"
                      repeatCount="indefinite"
                    ></animateTransform>
                  </ellipse>
                </g>
                <circle cx="25" cy="25" r="3" fill="#60A5FA">
                  <animate
                    attributeName="r"
                    values="3;4;3"
                    dur="1s"
                    repeatCount="indefinite"
                  ></animate>
                </circle>
              </g>
            </svg>
            <span className="text-white">Please wait...</span>
          </div>
        )}
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
              required
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
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-semibold rounded-md transition mb-8"
            disabled={loading}
          >
            {loading ? "Processing..." : "Login"}
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
