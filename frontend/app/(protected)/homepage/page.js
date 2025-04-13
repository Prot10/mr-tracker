"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { HistoryChart } from "./HistoryChart";
import { SectionCards } from "./SectionCards";
import { SectionCharts } from "./SectionCharts";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Homepage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [netWorthData, setNetWorthData] = useState(null);

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

      const netWorthRes = await fetch(`${BACKEND_URL}/networth`, { headers });
      const netWorthJson = await netWorthRes.json();
      setNetWorthData(netWorthJson);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const cardsData = [
    {
      title: "Net Worth",
      description: "Current total net worth",
      value: netWorthData ? netWorthData.net_worth : 0,
      change: netWorthData ? netWorthData.net_worth_change_pct : 0,
    },
    {
      title: "Expenses",
      description: "Total spending in the last 30 days",
      value: netWorthData ? netWorthData.expense_last_30_days : 0,
      change: netWorthData ? netWorthData.expense_change_pct : 0,
    },
    {
      title: "Income",
      description: "Total income in the last 30 days",
      value: netWorthData ? netWorthData.income_last_30_days : 0,
      change: netWorthData ? netWorthData.income_change_pct : 0,
    },
    {
      title: "Investments",
      description: "Current total investment value",
      value: netWorthData ? netWorthData.investment_value_now : 0,
      change: netWorthData ? netWorthData.investment_value_30_days_ago : 0,
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards cardsData={cardsData} />

          <div className="px-4 lg:px-6">
            <HistoryChart />
          </div>

          <SectionCharts />
        </div>
      </div>
    </div>
  );
}
