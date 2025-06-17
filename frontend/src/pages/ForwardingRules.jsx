import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForwardingRules } from "../hooks/useForwardingRules";
import { useChannels } from "../hooks/useChannels";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Filter,
  Play,
  Pause,
  Loader2,
  Crown,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function ForwardingRules() {
  const { user } = useAuth();
  const {
    rules,
    isLoading: rulesLoading,
    createRule,
    deleteRule,
    toggleRule,
    isCreating,
    isDeleting,
    isToggling,
  } = useForwardingRules();
  const { channels } = useChannels();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    source_channel_id: "",
    target_channel_id: "",
    filter_keywords: "",
    exclude_keywords: "",
    is_active: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const ruleData = {
      ...formData,
      filter_keywords: formData.filter_keywords
        ? formData.filter_keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k)
        : [],
      exclude_keywords: formData.exclude_keywords
        ? formData.exclude_keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k)
        : [],
    };

    createRule(ruleData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          source_channel_id: "",
          target_channel_id: "",
          filter_keywords: "",
          exclude_keywords: "",
          is_active: true,
        });
      },
    });
  };

  const handleToggle = (ruleId) => {
    toggleRule(ruleId);
  };

  const handleDelete = (ruleId) => {
    deleteRule(ruleId);
  };

  const getChannelName = (channelId) => {
    const channel = channels.find((c) => c.channel_id === channelId);
    return channel ? channel.channel_name : channelId;
  };

  const canCreateRule = user?.subscription_active || rules.length < 3;

  if (rulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex items-center justify-between" {...fadeInUp}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Forwarding Rules
          </h1>
          <p className="text-muted-foreground">
            Create and manage your message forwarding automation
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreateRule}>
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Forwarding Rule</DialogTitle>
                <DialogDescription>
                  Set up a new rule to automatically forward messages between
                  channels.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="source_channel_id">Source Channel</Label>
                  <Select
                    value={formData.source_channel_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        source_channel_id: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.channel_id}>
                          {channel.channel_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="target_channel_id">Target Channel</Label>
                  <Select
                    value={formData.target_channel_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        target_channel_id: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.channel_id}>
                          {channel.channel_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Label htmlFor="filter_keywords">
                    Include Keywords
                    <span className="text-muted-foreground text-sm ml-1">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    id="filter_keywords"
                    placeholder="keyword1, keyword2, keyword3"
                    value={formData.filter_keywords}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        filter_keywords: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Only forward messages containing these keywords. Leave empty
                    to forward all messages.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="exclude_keywords">
                    Exclude Keywords
                    <span className="text-muted-foreground text-sm ml-1">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    id="exclude_keywords"
                    placeholder="spam, ads, promotion"
                    value={formData.exclude_keywords}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        exclude_keywords: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Don't forward messages containing these keywords.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label htmlFor="is_active">Enable rule immediately</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Rule"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Free Plan Warning */}
      {!user?.subscription_active && (
        <motion.div {...fadeInUp}>
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Free Plan: {rules.length}/3 rules used
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Upgrade to Premium for unlimited forwarding rules
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <motion.div {...fadeInUp}>
          <Card className="text-center py-12">
            <CardContent>
              <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No forwarding rules</h3>
              <p className="text-muted-foreground mb-4">
                Create your first forwarding rule to start automating message
                forwarding.
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                disabled={!canCreateRule}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
          initial="initial"
          animate="animate"
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {rules.map((rule) => (
            <motion.div key={rule.id} variants={fadeInUp}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          rule.is_active ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          {getChannelName(rule.source_channel_id)}
                          <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                          {getChannelName(rule.target_channel_id)}
                        </CardTitle>
                        <CardDescription>
                          {formatNumber(rule.messages_forwarded)} messages
                          forwarded
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(rule.id)}
                        disabled={isToggling}
                      >
                        {rule.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Forwarding Rule
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this forwarding
                              rule? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(rule.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {(rule.filter_keywords?.length > 0 ||
                    rule.exclude_keywords?.length > 0) && (
                    <div className="space-y-2">
                      {rule.filter_keywords?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium flex items-center">
                            <Filter className="mr-2 h-3 w-3" />
                            Include Keywords:
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rule.filter_keywords.map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {rule.exclude_keywords?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium flex items-center">
                            <Filter className="mr-2 h-3 w-3" />
                            Exclude Keywords:
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rule.exclude_keywords.map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="destructive"
                                className="text-xs"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Created: {formatDate(rule.created_at)}</span>
                    {rule.last_forwarded_at && (
                      <span>
                        Last forwarded: {formatDate(rule.last_forwarded_at)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default ForwardingRules;
