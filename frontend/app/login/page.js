"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      const userId = data.session.user.id;
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (accountData) {
        router.push("/homepage");
      } else {
        alert(
          "It looks like you haven't completed onboarding. Please complete the onboarding to continue."
        );
        router.push("/onboarding");
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
          Don't have an account yet?{" "}
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
