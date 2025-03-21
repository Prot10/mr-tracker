"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Homepage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [netWorthData, setNetWorthData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
        fetchHomepageData(data.session.access_token);
      }
    };

    fetchSession();
  }, [router]);

  const fetchHomepageData = async (accessToken) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      // Fetch del net worth con tutti i valori aggregati
      const netWorthRes = await fetch(`${BACKEND_URL}/networth`, { headers });
      const netWorthJson = await netWorthRes.json();
      setNetWorthData(netWorthJson);

      const transactionsRes = await fetch(`${BACKEND_URL}/transactions`, {
        headers,
      });
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions);

      const investmentsRes = await fetch(`${BACKEND_URL}/investments`, {
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
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      {/* <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Homepage</h1>
        <p className="text-center mb-6">
          Benvenuto, {session.user.user_metadata?.name || session.user.email}
        </p>

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
            Net Worth:{" "}
            {netWorthData ? netWorthData.net_worth : "Caricamento..."}
          </h2>
          {netWorthData && (
            <div className="text-sm text-gray-400">
              <p>Investimenti: {netWorthData.investment_value_now}</p>
              <p>Income 30gg: {netWorthData.income_last_30_days}</p>
              <p>Expense 30gg: {netWorthData.expense_last_30_days}</p>
              <p>Net Worth Change: {netWorthData.net_worth_change_pct}%</p>
            </div>
          )}
        </div>
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Transazioni</h3>
          <TransactionsTable data={transactions} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Investimenti</h3>
          <InvestmentsTable data={investments} />
        </div>
      </div> */}
    </div>
  );
}
