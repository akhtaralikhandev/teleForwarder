import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  MessageSquare,
  Zap,
  Crown,
  Play,
  Pause,
  TrendingUp,
  Users,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
  });

  const { data: botStatus, isLoading: botStatusLoading } = useQuery({
    queryKey: ["botStatus"],
    queryFn: () => apiClient.getBotStatus(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", 7],
    queryFn: () => apiClient.getAnalytics(7),
  });

  const startBot = async () => {
    try {
      await apiClient.startBot();
    } catch (error) {
      console.error("Failed to start bot:", error);
    }
  };

  const stopBot = async () => {
    try {
      await apiClient.stopBot();
    } catch (error) {
      console.error("Failed to stop bot:", error);
    }
  };

  if (statsLoading || botStatusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div className="flex items-center justify-between" {...fadeInUp}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your Telegram forwarding activity.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {user?.subscription_active && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Crown className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Bot Status Card */}
      <motion.div {...fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Bot Status
            </CardTitle>
            <CardDescription>
              Control your Telegram forwarding bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    botStatus?.running ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <div>
                  <p className="font-medium">
                    {botStatus?.running ? "Running" : "Stopped"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {botStatus?.active_rules || 0} active rules
                  </p>
                </div>
              </div>
              <Button
                onClick={botStatus?.running ? stopBot : startBot}
                variant={botStatus?.running ? "destructive" : "default"}
              >
                {botStatus?.running ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Bot
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Bot
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Channels
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.total_channels || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Connected channels
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Rules
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.active_rules || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                of {stats?.total_rules || 0} total rules
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Messages Forwarded
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.total_messages_forwarded || 0}
              </div>
              <p className="text-xs text-muted-foreground">All time total</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Subscription
              </CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.subscription_active ? "Premium" : "Free"}
              </div>
              <p className="text-xs text-muted-foreground">Current plan</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Analytics Chart */}
      {analytics?.daily_stats && (
        <motion.div {...fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>Message Activity (Last 7 Days)</CardTitle>
              <CardDescription>
                Daily message forwarding statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.daily_stats}>
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
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="filtered"
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <motion.div {...fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Add New Channel
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Zap className="mr-2 h-4 w-4" />
                Create Forwarding Rule
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div {...fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current system health and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">API Status</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Operational
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Telegram Connection</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Connected
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Performance</span>
                  <span>98%</span>
                </div>
                <Progress value={98} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Usage Progress for Free Users */}
      {!user?.subscription_active && (
        <motion.div {...fadeInUp}>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-800 dark:text-amber-200">
                <AlertCircle className="mr-2 h-5 w-5" />
                Free Plan Usage
              </CardTitle>
              <CardDescription>
                You're currently on the free plan with limited features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Forwarding Rules</span>
                  <span>{stats?.total_rules || 0}/3</span>
                </div>
                <Progress
                  value={((stats?.total_rules || 0) / 3) * 100}
                  className="h-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Upgrade to Premium</p>
                  <p className="text-xs text-muted-foreground">
                    Unlock unlimited rules and advanced features
                  </p>
                </div>
                <Button>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;
