"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AddInvestment() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  const [assetName, setAssetName] = useState("");
  const [investedAmount, setInvestedAmount] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const token = session.access_token;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${BACKEND_URL}/investments`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        asset_name: assetName,
        invested_amount: parseFloat(investedAmount),
      }),
    });

    if (response.ok) {
      alert("Investimento aggiunto!");
      router.push("/homepage");
    } else {
      const data = await response.json();
      setError(data.detail || "Errore durante l'aggiunta");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Aggiungi Investimento
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Nome Attivo:</label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nome dell'attivo"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">
              Importo Investito:
            </label>
            <input
              type="number"
              value={investedAmount}
              onChange={(e) => setInvestedAmount(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Inserisci l'importo"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-md transition"
          >
            Aggiungi
          </button>
        </form>
      </div>
    </div>
  );
}
