"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/my-input";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!name.trim()) {
      toast.error("Name Required", {
        description: "Please enter your full name",
      });
      return;
    }

    if (!email.trim()) {
      toast.error("Email Required", {
        description: "Please enter a valid email address",
      });
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Password Required", {
        description: "Please fill in both password fields",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password Mismatch", {
        description: "The passwords you entered don't match",
      });
      return;
    }

    if (password.length < 8) {
      toast.error("Password Too Short", {
        description: "Password must be at least 8 characters long",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Registration Successful!", {
        description: "Welcome to Mr. Tracker! Redirecting to onboarding...",
        duration: 2000,
      });

      // Wait for toast to show before redirect
      setTimeout(() => router.push("/onboarding"), 2000);
    } catch (err) {
      toast.error("Registration Failed", {
        description: err.message || "An error occurred during signup",
      });
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
          Sign Up
        </h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="mb-4">
            <Label htmlFor="name" className="text-gray-300">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Gino"
              required
            />
          </div>
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
          <div className="mb-4">
            <Label htmlFor="password" className="text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              showPasswordToggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="MrTracker2025"
              required
            />
          </div>
          <div className="mb-8">
            <Label htmlFor="confirmPassword" className="text-gray-300">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              showPasswordToggle
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="MrTracker2025"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-semibold rounded-md transition mb-8"
          >
            Sign Up
          </button>
        </form>
        <p className="text-center text-gray-400">
          Already have an account?{" "}
          <span
            className="text-indigo-500 cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
