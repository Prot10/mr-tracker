import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ExpensesPlot } from "./ExpensesPlot";
import { PortfolioPlot } from "./PortfolioPlot";

export function SectionPlots() {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-3 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <PortfolioPlot />

      <ExpensesPlot />

      <Card className="@container/card border-neutral-600">
        <CardHeader className="relative">
          <CardDescription className="text-xl">Title</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            Description
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm text-neutral-200">
          Footer
        </CardFooter>
      </Card>
    </div>
  );
}
