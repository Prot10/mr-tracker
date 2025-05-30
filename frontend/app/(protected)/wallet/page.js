"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import TransactionsTable from "./Table";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Homepage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
        fetchTransactionData(data.session.access_token);
      }
    };

    fetchSession();
  }, [router]);

  const fetchTransactionData = async (accessToken) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      const transactionsRes = await fetch(`${BACKEND_URL}/transactions`, {
        headers,
      });
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions);
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
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <TransactionsTable data={transactions} />
        </div>
      </div>
    </div>
  );
}
