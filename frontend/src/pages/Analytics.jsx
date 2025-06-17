import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
  RefreshCw,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatNumber, formatDate } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];

function Analytics() {
  const [timeRange, setTimeRange] = useState("7");

  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["analytics", timeRange],
    queryFn: () => apiClient.getAnalytics(parseInt(timeRange)),
  });

  const { data: performance } = useQuery({
    queryKey: ["performance"],
    queryFn: () => apiClient.getPerformanceMetrics(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: logs } = useQuery({
    queryKey: ["logs", { days: timeRange, limit: 10 }],
    queryFn: () => apiClient.getForwardingLogs({ days: timeRange, limit: 10 }),
  });

  const handleRefresh = () => {
    refetch();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "text-green-600";
      case "FAILED":
        return "text-red-600";
      case "FILTERED":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "FILTERED":
        return <Filter className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex items-center justify-between" {...fadeInUp}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your forwarding performance and insights
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      {performance && (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          {...fadeInUp}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.success_rate}%
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Messages Today
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(performance.total_messages_24h)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(performance.successful_messages_24h)} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Processing
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.avg_processing_time}s
              </div>
              <p className="text-xs text-muted-foreground">Per message</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bot Uptime</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.bot_uptime_hours.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">
                Continuous runtime
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Analytics Tabs */}
      <motion.div {...fadeInUp}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Rules Performance</TabsTrigger>
            <TabsTrigger value="errors">Error Analysis</TabsTrigger>
            <TabsTrigger value="logs">Recent Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Daily Activity Chart */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Message Activity Over Time</CardTitle>
                  <CardDescription>
                    Daily forwarding activity for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.daily_stats || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) =>
                            new Date(value).toLocaleDateString()
                          }
                          formatter={(value, name) => [
                            value,
                            name === "successful"
                              ? "Successful"
                              : name === "failed"
                              ? "Failed"
                              : "Filtered",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="successful"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="successful"
                        />
                        <Line
                          type="monotone"
                          dataKey="failed"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="failed"
                        />
                        <Line
                          type="monotone"
                          dataKey="filtered"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="filtered"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Message Status Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of message forwarding results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Successful",
                              value:
                                analytics?.daily_stats?.reduce(
                                  (sum, day) => sum + (day.successful || 0),
                                  0
                                ) || 0,
                              color: "#10b981",
                            },
                            {
                              name: "Failed",
                              value:
                                analytics?.daily_stats?.reduce(
                                  (sum, day) => sum + (day.failed || 0),
                                  0
                                ) || 0,
                              color: "#ef4444",
                            },
                            {
                              name: "Filtered",
                              value:
                                analytics?.daily_stats?.reduce(
                                  (sum, day) => sum + (day.filtered || 0),
                                  0
                                ) || 0,
                              color: "#f59e0b",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rules Performance Tab */}
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Rules</CardTitle>
                <CardDescription>
                  Rules ranked by messages forwarded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.top_rules?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.top_rules.map((rule, index) => (
                      <div
                        key={rule.rule_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">
                              {rule.source_channel} → {rule.target_channel}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Rule ID: {rule.rule_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatNumber(rule.messages_forwarded)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            messages
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No rule performance data available for the selected period.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Analysis Tab */}
          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Common Errors</CardTitle>
                <CardDescription>
                  Most frequent error messages and their occurrences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.common_errors?.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.common_errors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{error.error}</p>
                          </div>
                        </div>
                        <Badge variant="destructive">{error.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No error data available for the selected period.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest forwarding attempts and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs?.length > 0 ? (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="text-sm font-medium">
                              Message ID: {log.source_message_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rule ID: {log.rule_id} •{" "}
                              {formatDate(log.created_at)}
                            </p>
                            {log.error_message && (
                              <p className="text-xs text-red-600 mt-1">
                                {log.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            log.status === "SUCCESS"
                              ? "default"
                              : log.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent activity to display.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

export default Analytics;
