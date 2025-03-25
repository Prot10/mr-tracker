import { ComparisonChart } from "./ComparisonChart";
import { ExpensesChart } from "./ExpensesChart";
import { PortfolioChart } from "./PortfolioChart";

export function SectionCharts() {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-3 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <PortfolioChart />

      <ComparisonChart />

      <ExpensesChart />
    </div>
  );
}
