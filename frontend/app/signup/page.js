"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Le password non corrispondono");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      alert("Controlla la tua email per confermare la registrazione!");
      router.push("/login");
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
          Registrazione
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="mb-4">
            <Label htmlFor="name" className="text-gray-300">
              Nome
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Inserisci il tuo nome"
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
              placeholder="esempio@dominio.com"
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
            />
          </div>
          <div className="mb-8">
            <Label htmlFor="confirmPassword" className="text-gray-300">
              Conferma Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              showPasswordToggle
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="MrTracker2025"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-semibold rounded-md transition mb-8"
          >
            Registrati
          </button>
        </form>
        <p className="text-center text-gray-400">
          Hai già un account?{" "}
          <span
            className="text-indigo-500 cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Accedi
          </span>
        </p>
      </div>
    </div>
  );
}
