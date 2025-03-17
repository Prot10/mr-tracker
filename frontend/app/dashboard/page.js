"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import InvestmentsTable from "../components/InvestmentsTable";
import TransactionsTable from "../components/TransactionsTable";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
        fetchDashboardData(data.session.access_token);
      }
    };

    fetchSession();
  }, [router]);

  const fetchDashboardData = async (accessToken) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      const netWorthRes = await fetch("http://localhost:8000/networth", {
        headers,
      });
      const netWorthData = await netWorthRes.json();
      setNetWorth(netWorthData.net_worth);

      const transactionsRes = await fetch(
        "http://localhost:8000/transactions",
        { headers }
      );
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions);

      const investmentsRes = await fetch("http://localhost:8000/investments", {
        headers,
      });
      const investmentsData = await investmentsRes.json();
      setInvestments(investmentsData.investments);
    } catch (error) {
      console.error("Errore nel recupero dei dati:", error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        Caricamento...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Dashboard</h1>
        <p className="text-center mb-6">
          Benvenuto, utente: {session.user.email}
        </p>

        {/* Bottoni per aggiungere transazioni ed investimenti */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
          <Link
            href="/add-transaction"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"
          >
            Aggiungi Transazione
          </Link>
          <Link
            href="/add-investment"
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition"
          >
            Aggiungi Investimento
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Net Worth: {netWorth !== null ? netWorth : "Caricamento..."}
          </h2>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Transazioni</h3>
          <TransactionsTable data={transactions} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Investimenti</h3>
          <InvestmentsTable data={investments} />
        </div>
      </div>
    </div>
  );
}
