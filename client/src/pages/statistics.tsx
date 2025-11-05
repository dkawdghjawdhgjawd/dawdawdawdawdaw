import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Statistics, ServerInfo } from "@shared/schema";

type TimeRange = "24h" | "7d" | "30d" | "all";

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [selectedServerId, setSelectedServerId] = useState<string>("all");

  // Fetch available servers
  const { data: servers } = useQuery<ServerInfo[]>({
    queryKey: ["/api/servers"],
  });

  // Fetch aggregated statistics from backend
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats", selectedServerId, timeRange],
    queryFn: () => {
      const params = new URLSearchParams({ timeRange });
      if (selectedServerId !== "all") {
        params.set("serverId", selectedServerId);
      }
      return fetch(`/api/stats?${params.toString()}`).then(res => res.json());
    },
  });

  // Process backend stats into chart data
  const trendData = stats?.dailyTrends || [];
  
  const violationTypeData = Object.entries(stats?.violationsByType || {}).map(([type, count]) => {
    const colors: Record<string, string> = {
      toxicity: "hsl(var(--destructive))",
      spam: "hsl(var(--chart-4))",
      harassment: "hsl(var(--chart-5))",
      inappropriate: "hsl(var(--chart-2))",
      hate_speech: "hsl(var(--destructive))",
    };
    return {
      name: type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      value: count as number,
      color: colors[type] || "hsl(var(--primary))",
    };
  }).filter(item => item.value > 0);

  const actionDistributionData = Object.entries(stats?.actionsByType || {}).map(([action, count]) => ({
    action: action.charAt(0).toUpperCase() + action.slice(1),
    count: count as number,
  })).filter(item => item.count > 0);

  const topViolators = (stats?.topViolators || []).map((v: any) => ({
    username: v.username,
    avatar: null,
    violations: v.count,
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold" data-testid="text-statistics-title">Statistics</h1>
            <p className="text-muted-foreground mt-2">
              Analyze moderation trends and patterns
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedServerId} onValueChange={setSelectedServerId}>
              <SelectTrigger className="w-[200px]" data-testid="select-server">
                <SelectValue placeholder="Select Server" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-all-servers">All Servers</SelectItem>
                {servers?.map(server => (
                  <SelectItem 
                    key={server.id} 
                    value={server.id}
                    data-testid={`option-server-${server.id}`}
                  >
                    {server.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <TabsList data-testid="tabs-time-range">
                <TabsTrigger value="24h" data-testid="tab-24h">24h</TabsTrigger>
                <TabsTrigger value="7d" data-testid="tab-7d">7 days</TabsTrigger>
                <TabsTrigger value="30d" data-testid="tab-30d">30 days</TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-all">All time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading statistics...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold" data-testid="text-statistics-title">Statistics</h1>
          <p className="text-muted-foreground mt-2">
            Analyze moderation trends and patterns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedServerId} onValueChange={setSelectedServerId}>
            <SelectTrigger className="w-[200px]" data-testid="select-server">
              <SelectValue placeholder="Select Server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-all-servers">All Servers</SelectItem>
              {servers?.map(server => (
                <SelectItem 
                  key={server.id} 
                  value={server.id}
                  data-testid={`option-server-${server.id}`}
                >
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList data-testid="tabs-time-range">
              <TabsTrigger value="24h" data-testid="tab-24h">24h</TabsTrigger>
              <TabsTrigger value="7d" data-testid="tab-7d">7 days</TabsTrigger>
              <TabsTrigger value="30d" data-testid="tab-30d">30 days</TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">All time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Violation Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Violation Trends</CardTitle>
          <CardDescription>
            Number of violations detected over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="violations" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Violation Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Violation Types</CardTitle>
            <CardDescription>
              Distribution of detected violation categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={violationTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {violationTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Action Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Taken</CardTitle>
            <CardDescription>
              How violations were handled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionDistributionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    dataKey="action" 
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Violators */}
      <Card>
        <CardHeader>
          <CardTitle>Top Violators</CardTitle>
          <CardDescription>
            Users with the most detected violations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topViolators.map((violator, index) => (
              <div
                key={violator.username}
                className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                data-testid={`violator-${index}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-medium">
                    {violator.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{violator.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {violator.violations} violations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-destructive"
                      style={{ width: `${Math.min((violator.violations / 15) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium tabular-nums w-8 text-right">
                    {violator.violations}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
