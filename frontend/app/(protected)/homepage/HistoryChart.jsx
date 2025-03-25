"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { supabase } from "../../lib/supabaseClient";

// Config per Recharts (colori, label, ecc.)
const chartConfig = {
  networth: {
    label: "Net Worth",
    color: "hsl(var(--chart-2))",
  },
  investments: {
    label: "Investments",
    color: "hsl(var(--chart-5))",
  },
};

export function HistoryChart() {
  const [timeRange, setTimeRange] = useState("90");
  const [chartData, setChartData] = useState([]);

  // In produzione: sposta BACKEND_URL in un file di config o .env
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Fetch dei dati ogni volta che cambia timeRange
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResult = await supabase.auth.getSession();
        const token = sessionResult.data?.session?.access_token;
        if (!token) {
          console.error("Nessun token disponibile");
          return;
        }
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const res = await fetch(`${BACKEND_URL}/networth-history?range=180`, {
          headers,
        });
        if (!res.ok) {
          throw new Error("Errore nella chiamata API");
        }
        const data = await res.json();
        setChartData(data);
      } catch (error) {
        console.error("Errore fetch networth history:", error);
      }
    };

    fetchData();
  }, []);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const endDate = new Date();
    let daysToSubtract = 180;
    if (timeRange === "90") daysToSubtract = 90;
    else if (timeRange === "30") daysToSubtract = 30;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card border-neutral-600">
      <CardHeader className="flex items-center gap-2 space-y-0 border-neutral-600 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Net Worth & Investments</CardTitle>
          <CardDescription className="text-neutral-400">
            Showing data for the last {timeRange} days
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto border-neutral-600 text-neutral-300"
            aria-label="Select a value"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-neutral-950">
            <SelectItem value="180" className="rounded-lg">
              Last 6 months
            </SelectItem>
            <SelectItem value="90" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30" className="rounded-lg">
              Last 30 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillNetworth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-networth)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-networth)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillInvestments" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-investments)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-investments)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} horizontal={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const dt = new Date(value);
                return dt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            {/* <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={10}
            /> */}
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="investments"
              type="monotone"
              fill="url(#fillInvestments)"
              stroke="var(--color-investments)"
              stackId="a"
            />
            <Area
              dataKey="networth"
              type="monotone"
              fill="url(#fillNetworth)"
              stroke="var(--color-networth)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
