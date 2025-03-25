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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart";
import { supabase } from "../../lib/supabaseClient";

export function ExpensesPlot() {
  const [chartData, setChartData] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
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
          Authorization: `Bearer ${token}`,
        };

        const res = await fetch(`${BACKEND_URL}/expenses-by-category`, {
          headers,
        });
        if (!res.ok) throw new Error("API call failed");

        const data = await res.json();

        // Transform data and assign dynamic colors with dynamic category mapping
        const uniqueCategories = Array.from(
          new Set(data.map((item) => item.category.toLowerCase()))
        );
        const categoryMapping = {};
        uniqueCategories.forEach((cat) => {
          // Convert to Title Case
          categoryMapping[cat] = cat
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        });

        const transformedData = data.map((item, index) => ({
          category:
            categoryMapping[item.category.toLowerCase()] || item.category,
          value: item.amount,
          fill: `hsl(var(--chart-${(index % 9) + 1}))`,
        }));

        const total = data.reduce((sum, item) => sum + item.amount, 0);
        setTotalExpenses(total);
        setChartData(transformedData);
      } catch (error) {
        console.error("Error fetching expenses data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="flex flex-col border-neutral-600">
      <CardHeader className="items-center pb-0">
        <CardTitle>Expenses by Category</CardTitle>
        <CardDescription className="text-neutral-400">
          Last 30 days spending breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          className="mx-auto aspect-square max-h-[350px]"
          config={chartData.reduce(
            (acc, item) => ({
              ...acc,
              [item.category]: {
                label: item.category,
                color: item.fill,
              },
            }),
            {}
          )}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
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
                          {totalExpenses.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-neutral-300"
                        >
                          Total Expenses
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="category" />}
              wrapperStyle={{ overflow: "auto" }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
