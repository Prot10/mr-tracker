import { MoveRight, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import { Badge } from "../../components/ui/badge";

export function SectionCards({ cardsData }) {
  function getTrendProps(value, cardTitle) {
    // For a consistent neutral range, we consider values between -1 and +1 as neutral
    if (cardTitle === "Expenses") {
      if (value > 1) {
        return {
          icon: <TrendingDownIcon className="size-3" />, // Increased expenses are bad
          colorClass: "text-red-600",
          badgeText: `+${value}%`,
          footerText: "Holy smokes, your spending is off the charts!",
        };
      } else if (value < -1) {
        return {
          icon: <TrendingUpIcon className="size-3" />, // Decreased expenses are good
          colorClass: "text-green-600",
          badgeText: `${value}%`,
          footerText: "Great job, you're cutting costs like a boss!",
        };
      } else {
        return {
          icon: <MoveRight className="size-3" />,
          colorClass: "text-blue-600",
          badgeText: `${value}%`,
          footerText: "You can do better.",
        };
      }
    } else if (cardTitle === "Net Worth") {
      if (value > 1) {
        return {
          icon: <TrendingUpIcon className="size-3" />,
          colorClass: "text-green-600",
          badgeText: `+${value}%`,
          footerText: "The Ferrari is getting closer",
        };
      } else if (value < -1) {
        return {
          icon: <TrendingDownIcon className="size-3" />,
          colorClass: "text-red-600",
          badgeText: `${value}%`,
          footerText: "The Ferrari is drifting away",
        };
      } else {
        return {
          icon: <MoveRight className="size-3" />,
          colorClass: "text-blue-600",
          badgeText: `${value}%`,
          footerText: "You can do better.",
        };
      }
    } else if (cardTitle === "Income") {
      if (value > 1) {
        return {
          icon: <TrendingUpIcon className="size-3" />,
          colorClass: "text-green-600",
          badgeText: `+${value}%`,
          footerText: "You're outshining Jordan Belfort",
        };
      } else if (value < -1) {
        return {
          icon: <TrendingDownIcon className="size-3" />,
          colorClass: "text-red-600",
          badgeText: `${value}%`,
          footerText: "Step up your game, just do it",
        };
      } else {
        return {
          icon: <MoveRight className="size-3" />,
          colorClass: "text-blue-600",
          badgeText: `${value}%`,
          footerText: "You can do better.",
        };
      }
    } else if (cardTitle === "Investments") {
      if (value > 1) {
        return {
          icon: <TrendingUpIcon className="size-3" />,
          colorClass: "text-green-600",
          badgeText: `+${value}%`,
          footerText: "Rocketing to the moon!",
        };
      } else if (value < -1) {
        return {
          icon: <TrendingDownIcon className="size-3" />,
          colorClass: "text-red-600",
          badgeText: `${value}%`,
          footerText: "Oh no, here we go again",
        };
      } else {
        return {
          icon: <MoveRight className="size-3" />,
          colorClass: "text-blue-600",
          badgeText: `${value}%`,
          footerText: "You can do better.",
        };
      }
    } else {
      // Fallback logic
      if (value > 1) {
        return {
          icon: <TrendingUpIcon className="size-3" />,
          colorClass: "text-green-600",
          badgeText: `+${value}%`,
          footerText: "Trending up",
        };
      } else if (value < -1) {
        return {
          icon: <TrendingDownIcon className="size-3" />,
          colorClass: "text-red-600",
          badgeText: `${value}%`,
          footerText: "Trending down",
        };
      } else {
        return {
          icon: <MoveRight className="size-3" />,
          colorClass: "text-blue-600",
          badgeText: `${value}%`,
          footerText: "You can do better.",
        };
      }
    }
  }

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      {cardsData.map((card) => {
        const trendProps = getTrendProps(card.change, card.title);
        return (
          <Card className="@container/card border-neutral-600" key={card.title}>
            <CardHeader className="relative">
              <CardDescription className="text-xl">
                {card.title}
              </CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                €{card.value}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <Badge
                  variant="outline"
                  className={`flex gap-1 rounded-lg text-xs ${trendProps.colorClass}`}
                >
                  {trendProps.icon}
                  {trendProps.badgeText}
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm text-neutral-200">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {trendProps.footerText}
              </div>
              <div className="text-muted-foreground">{card.description}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
