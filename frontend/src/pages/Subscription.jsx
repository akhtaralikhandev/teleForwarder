import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Crown,
  Check,
  X,
  CreditCard,
  Calendar,
  Zap,
  Shield,
  BarChart3,
  Globe,
  Users,
  Filter,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get subscription status
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => apiClient.getSubscriptionStatus(),
    enabled: !!user?.subscription_active,
    retry: false,
  });

  // Get subscription plans
  const { data: plans } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: () => apiClient.getSubscriptionPlans(),
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: () => apiClient.createSubscription(),
    onSuccess: (data) => {
      if (data.approval_url) {
        window.open(data.approval_url, "_blank");
        toast({
          title: "Redirecting to PayPal",
          description: "Complete your payment to activate premium features.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => apiClient.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = () => {
    createSubscriptionMutation.mutate();
  };

  const handleCancel = () => {
    cancelSubscriptionMutation.mutate();
  };

  const freeFeatures = [
    { name: "Up to 3 forwarding rules", included: true },
    { name: "Public channels only", included: true },
    { name: "Basic filtering", included: true },
    { name: "Community support", included: true },
    { name: "Standard analytics", included: true },
    { name: "Private channels", included: false },
    { name: "Unlimited rules", included: false },
    { name: "Advanced filtering", included: false },
    { name: "Priority support", included: false },
    { name: "Custom webhooks", included: false },
  ];

  const premiumFeatures = [
    { name: "Unlimited forwarding rules", icon: Zap },
    { name: "Private channels & groups", icon: Shield },
    { name: "Advanced filtering options", icon: Filter },
    { name: "Priority customer support", icon: Users },
    { name: "Detailed analytics & insights", icon: BarChart3 },
    { name: "Custom webhook integration", icon: Globe },
    { name: "Export capabilities", icon: BarChart3 },
    { name: "99.9% uptime guarantee", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex items-center justify-between" {...fadeInUp}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing preferences
          </p>
        </div>

        {user?.subscription_active && (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Crown className="mr-1 h-3 w-3" />
            Premium Active
          </Badge>
        )}
      </motion.div>

      {/* Current Plan Status */}
      <motion.div {...fadeInUp}>
        <Card
          className={
            user?.subscription_active
              ? "border-purple-200 dark:border-purple-800"
              : ""
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  {user?.subscription_active ? (
                    <>
                      <Crown className="mr-2 h-5 w-5 text-purple-500" />
                      Premium Plan
                    </>
                  ) : (
                    "Free Plan"
                  )}
                </CardTitle>
                <CardDescription>
                  {user?.subscription_active
                    ? "You have access to all premium features"
                    : "You are currently on the free plan with limited features"}
                </CardDescription>
              </div>

              {user?.subscription_active ? (
                <div className="text-right">
                  <p className="text-2xl font-bold">$9.99</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-2xl font-bold">$0</p>
                  <p className="text-sm text-muted-foreground">forever</p>
                </div>
              )}
            </div>
          </CardHeader>

          {user?.subscription_active && subscription && (
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Subscription Details</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge
                        variant={
                          subscription.status === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Started:</span>
                      <span>{formatDate(subscription.created_at)}</span>
                    </div>
                    {subscription.next_billing_time && (
                      <div className="flex justify-between">
                        <span>Next billing:</span>
                        <span>
                          {formatDate(subscription.next_billing_time)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Billing Information</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>
                        {formatCurrency(
                          subscription.amount,
                          subscription.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment method:</span>
                      <span className="flex items-center">
                        <CreditCard className="mr-1 h-3 w-3" />
                        PayPal
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage in PayPal
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your premium
                        subscription? You will lose access to premium features
                        at the end of your current billing period.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        {cancelSubscriptionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          "Cancel Subscription"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Feature Comparison */}
      <motion.div {...fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
            <CardDescription>See what's included in each plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Free Plan */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Free Plan</h3>
                  <p className="text-2xl font-bold">$0</p>
                  <p className="text-sm text-muted-foreground">Forever</p>
                </div>

                <div className="space-y-3">
                  {freeFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          !feature.included ? "text-muted-foreground" : ""
                        }`}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {user?.subscription_active && (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                )}
              </div>

              {/* Premium Plan */}
              <div className="space-y-4 relative">
                {!user?.subscription_active && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                    Recommended
                  </Badge>
                )}

                <div className="text-center">
                  <h3 className="text-lg font-semibold flex items-center justify-center">
                    <Crown className="mr-2 h-5 w-5 text-purple-500" />
                    Premium Plan
                  </h3>
                  <p className="text-2xl font-bold">$9.99</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>

                <div className="space-y-3">
                  {premiumFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <feature.icon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                </div>

                {user?.subscription_active ? (
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Active Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleUpgrade}
                    disabled={createSubscriptionMutation.isPending}
                  >
                    {createSubscriptionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade to Premium
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ */}
      <motion.div {...fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">
                Can I cancel my subscription anytime?
              </h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll
                continue to have access to premium features until the end of
                your current billing period.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">
                What happens to my data if I cancel?
              </h4>
              <p className="text-sm text-muted-foreground">
                Your forwarding rules and settings will be preserved. However,
                rules exceeding the free plan limit (3 rules) will be
                deactivated until you upgrade again.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Do you offer refunds?</h4>
              <p className="text-sm text-muted-foreground">
                We offer a 7-day money-back guarantee for first-time
                subscribers. Contact support for assistance with refund
                requests.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">
                How secure is my payment information?
              </h4>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely through PayPal. We don't
                store any payment information on our servers.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default Subscription;
