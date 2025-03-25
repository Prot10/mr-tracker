"use client";

import { useEffect, useState } from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart";
import { supabase } from "../../lib/supabaseClient";

const chartConfig = {
  available_money: {
    label: "Available Money",
    color: "hsl(var(--chart-1))",
  },
  stocks: {
    label: "Stocks",
    color: "hsl(var(--chart-2))",
  },
  etf: {
    label: "ETF",
    color: "hsl(var(--chart-3))",
  },
  crypto: {
    label: "Crypto",
    color: "hsl(var(--chart-4))",
  },
};

export function PortfolioPlot() {
  const [compositionData, setCompositionData] = useState([]);
  const [totalNetWorth, setTotalNetWorth] = useState(0);
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

        const res = await fetch(`${BACKEND_URL}/finance-composition`, {
          headers,
        });
        if (!res.ok) throw new Error("API call failed");

        const data = await res.json();
        setTotalNetWorth(data.total_net_worth);

        // Transform API response to chart data format
        const transformedData = data.composition.map((item, index) => ({
          category: item.category,
          value: item.value,
          fill: `hsl(var(--chart-${index + 1}))`,
        }));

        setCompositionData(transformedData);
      } catch (error) {
        console.error("Error fetching composition data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="flex flex-col border-neutral-600">
      <CardHeader className="items-center pb-0">
        <CardTitle>Portfolio Composition</CardTitle>
        <CardDescription>Real-time asset distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={compositionData}
              dataKey="value"
              nameKey="category"
              innerRadius={85}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          €
                          {totalNetWorth.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-foreground"
                        >
                          Total Net Worth
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
