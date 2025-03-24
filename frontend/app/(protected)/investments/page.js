"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import InvestmentsTable from "./Table";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Homepage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
        fetchInvestmentData(data.session.access_token);
      }
    };

    fetchSession();
  }, [router]);

  const fetchInvestmentData = async (accessToken) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

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
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <InvestmentsTable data={investments} />
        </div>
      </div>
    </div>
  );
}
