"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

export const description = "Jobs and applications trend";

const chartConfig = {
  jobs: {
    label: "Jobs Posted",
    color: "var(--chart-1)",
  },
  applications: {
    label: "Applications",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type ChartDataPoint = {
  date: string;
  jobs: number;
  applications: number;
};

export function ChartAreaInteractive({
  initialData = [],
}: {
  initialData?: ChartDataPoint[];
}) {
  const [timeRange, setTimeRange] = React.useState("7d");
  const [chartData, setChartData] =
    React.useState<ChartDataPoint[]>(initialData);
  const [loading, setLoading] = React.useState(false); // Default to false since we have initial data

  const fetchChartData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard/chart?range=${timeRange}`);
      const data = await res.json();
      if (data.chartData) {
        setChartData(data.chartData);
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  React.useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Calculate summary stats
  const totalJobs = chartData.reduce((sum, d) => sum + d.jobs, 0);
  const totalApplications = chartData.reduce(
    (sum, d) => sum + d.applications,
    0,
  );

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <div className="flex items-center gap-3">
            <CardTitle>Jobs vs Applications</CardTitle>
            {!loading && (
              <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                <span>
                  <span className="font-semibold text-foreground">
                    {totalJobs}
                  </span>{" "}
                  jobs
                </span>
                <span>
                  <span className="font-semibold text-foreground">
                    {totalApplications}
                  </span>{" "}
                  applications
                </span>
              </div>
            )}
          </div>
          <CardDescription>
            Daily jobs posted and applications received
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {chartData.length === 0 && !loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <span className="text-sm text-muted-foreground">
              No data available for this period.
            </span>
          </div>
        ) : (
          <div className="relative">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-jobs)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-jobs)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillApplications"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-applications)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-applications)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={value => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={value => {
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
                  dataKey="applications"
                  type="natural"
                  fill="url(#fillApplications)"
                  stroke="var(--color-applications)"
                  stackId="a"
                  isAnimationActive={false}
                />
                <Area
                  dataKey="jobs"
                  type="natural"
                  fill="url(#fillJobs)"
                  stroke="var(--color-jobs)"
                  stackId="a"
                  isAnimationActive={false}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
