"use client";

import { useEffect, useState } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart";
import { supabase } from "../../lib/supabaseClient";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-5))",
  },
};

const legendMapping = [
  {
    key: "income",
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
  {
    key: "expenses",
    label: "Expenses",
    color: "hsl(var(--chart-5))",
  },
];

export function ComparisonChart() {
  const [chartData, setChartData] = useState([]);
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResult = await supabase.auth.getSession();
        const token = sessionResult.data?.session?.access_token;
        if (!token) {
          console.error("No token available");
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const res = await fetch(`${BACKEND_URL}/monthly-finances`, { headers });
        if (!res.ok) throw new Error("API call failed");
        const data = await res.json();
        setChartData(data);
      } catch (error) {
        console.error("Error fetching monthly finances:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="flex flex-col border-neutral-600">
      <CardHeader className="items-center pb-0">
        <CardTitle>Monthly Finances</CardTitle>
        <CardDescription className="text-neutral-400">
          Income vs Expenses for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid />
            <Radar
              dataKey="income"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.6}
            />
            <Radar dataKey="expenses" fill="hsl(var(--chart-5))" />
            <ChartLegend
              className="mt-8"
              content={<ChartLegendContent data={legendMapping} />}
              wrapperStyle={{ overflow: "auto" }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
