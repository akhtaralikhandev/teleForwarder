import React, { useState } from "react";
import { motion } from "framer-motion";
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
import {
  MessageSquare,
  Plus,
  Trash2,
  Users,
  Globe,
  Lock,
  Loader2,
  Crown,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function Channels() {
  const { user } = useAuth();
  const {
    channels,
    isLoading,
    addChannel,
    deleteChannel,
    isAddingChannel,
    isDeletingChannel,
  } = useChannels();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    channel_id: "",
    channel_name: "",
    channel_type: "public",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addChannel(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          channel_id: "",
          channel_name: "",
          channel_type: "public",
        });
      },
    });
  };

  const handleDelete = (channelId) => {
    deleteChannel(channelId);
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "private":
        return <Lock className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getChannelBadge = (type) => {
    const variants = {
      public: "default",
      private: "secondary",
      group: "outline",
    };
    return <Badge variant={variants[type]}>{type}</Badge>;
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground">
            Manage your connected Telegram channels and groups
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Channel</DialogTitle>
                <DialogDescription>
                  Connect a new Telegram channel or group to start forwarding
                  messages.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="channel_id">Channel ID</Label>
                  <Input
                    id="channel_id"
                    placeholder="@channel_username or -100123456789"
                    value={formData.channel_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        channel_id: e.target.value,
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use @username for public channels or numeric ID for private
                    channels
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="channel_name">Display Name</Label>
                  <Input
                    id="channel_name"
                    placeholder="My Channel"
                    value={formData.channel_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        channel_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="channel_type">Channel Type</Label>
                  <Select
                    value={formData.channel_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, channel_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public Channel</SelectItem>
                      <SelectItem
                        value="private"
                        disabled={!user?.subscription_active}
                      >
                        Private Channel{" "}
                        {!user?.subscription_active && "(Premium)"}
                      </SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.channel_type === "private" &&
                    !user?.subscription_active && (
                      <p className="text-xs text-amber-600 flex items-center">
                        <Crown className="mr-1 h-3 w-3" />
                        Premium subscription required for private channels
                      </p>
                    )}
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
                <Button type="submit" disabled={isAddingChannel}>
                  {isAddingChannel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Channel"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Channels Grid */}
      {channels.length === 0 ? (
        <motion.div {...fadeInUp}>
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No channels connected
              </h3>
              <p className="text-muted-foreground mb-4">
                Connect your first Telegram channel to start forwarding
                messages.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Channel
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
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
          {channels.map((channel) => (
            <motion.div key={channel.id} variants={fadeInUp}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(channel.channel_type)}
                      <CardTitle className="text-lg">
                        {channel.channel_name}
                      </CardTitle>
                    </div>
                    {getChannelBadge(channel.channel_type)}
                  </div>
                  <CardDescription>ID: {channel.channel_id}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge
                        variant={channel.is_active ? "default" : "secondary"}
                      >
                        {channel.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Added:</span>
                      <span>{formatDate(channel.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeletingChannel}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "
                            {channel.channel_name}"? This action cannot be
                            undone and will also delete any forwarding rules
                            using this channel.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(channel.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

export default Channels;
