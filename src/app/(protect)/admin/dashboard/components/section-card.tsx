import {
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconBuilding,
  IconBriefcase,
  IconFileDescription,
} from "@tabler/icons-react";

import { Badge } from "@/src/components/ui/badge";
import { Card, CardHeader } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

type DashboardStats = {
  totalUsers: {
    total: number;
    growth: number;
  };
  companies: {
    total: number;
    growth: number;
  };
  activeJobs: {
    total: number;
    growth: number;
  };
  applicationsToday: {
    total: number;
    growth: number;
  };
};

const statCards = [
  {
    key: "totalUsers" as const,
    label: "Total Users",
    icon: IconUsers,
    borderColor: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    growthUpColor:
      "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400",
    growthDownColor:
      "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400",
    growthLabel: "vs last month",
  },
  {
    key: "companies" as const,
    label: "Companies",
    icon: IconBuilding,
    borderColor: "border-l-purple-500",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    growthUpColor:
      "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400",
    growthDownColor:
      "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400",
    growthLabel: "vs last month",
  },
  {
    key: "activeJobs" as const,
    label: "Active Jobs",
    icon: IconBriefcase,
    borderColor: "border-l-green-500",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    growthUpColor:
      "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400",
    growthDownColor:
      "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400",
    growthLabel: "vs last week",
  },
  {
    key: "applicationsToday" as const,
    label: "Applications Today",
    icon: IconFileDescription,
    borderColor: "border-l-orange-500",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    growthUpColor:
      "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400",
    growthDownColor:
      "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400",
    growthLabel: "vs yesterday",
  },
];

export function SectionCards({ stats }: { stats: DashboardStats }) {
  const formatNumber = (num: number) => num.toLocaleString();
  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {statCards.map(card => {
        const statData = stats[card.key];
        const Icon = card.icon;
        const isPositive = statData.growth >= 0;

        return (
          <Card key={card.key}>
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold tabular-nums tracking-tight">
                    {formatNumber(statData.total)}
                  </p>
                </div>
                {/* card iocn color */}
                <div className={cn("rounded-lg p-2.5", card.iconBg)}>
                  <Icon className={cn("h-5 w-5", card.iconColor)} />
                </div>
              </div>

              {/* Growth Badge Color*/}
              <div className="flex items-center gap-2 pt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 text-xs font-semibold border",
                    isPositive ? card.growthUpColor : card.growthDownColor,
                  )}
                >
                  {isPositive ? (
                    <IconTrendingUp className="size-3.5" />
                  ) : (
                    <IconTrendingDown className="size-3.5" />
                  )}
                  {formatGrowth(statData.growth)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {card.growthLabel}
                </span>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
