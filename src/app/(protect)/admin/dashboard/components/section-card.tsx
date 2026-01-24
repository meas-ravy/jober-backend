import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

type DashboardStats = {
  jobSeekers: {
    total: number;
    growth: number;
  };
  recruiters: {
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

export function SectionCards({ stats }: { stats: DashboardStats }) {
  const formatNumber = (num: number) => num.toLocaleString();
  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Job Seekers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.jobSeekers.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.jobSeekers.growth >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatGrowth(stats.jobSeekers.growth)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            New registrations this month{" "}
            {stats.jobSeekers.growth >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">Active job seeker growth</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Recruiters</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.recruiters.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.recruiters.growth >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatGrowth(stats.recruiters.growth)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Verified companies rising{" "}
            {stats.recruiters.growth >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Recruiter onboarding progress
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Jobs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.activeJobs.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.activeJobs.growth >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatGrowth(stats.activeJobs.growth)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Jobs approved this week{" "}
            {stats.activeJobs.growth >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">Hiring activity is stable</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Applications Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.applicationsToday.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.applicationsToday.growth >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatGrowth(stats.applicationsToday.growth)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong application volume{" "}
            {stats.applicationsToday.growth >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">Review queue keeps moving</div>
        </CardFooter>
      </Card>
    </div>
  );
}
