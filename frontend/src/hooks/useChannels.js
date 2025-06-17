import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";
import { useToast } from "@/components/ui/use-toast";

export function useChannels() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const channelsQuery = useQuery({
    queryKey: ["channels"],
    queryFn: () => apiClient.getChannels(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const addChannelMutation = useMutation({
    mutationFn: (channelData) => apiClient.addChannel(channelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "Success",
        description: "Channel added successfully!",
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

  const deleteChannelMutation = useMutation({
    mutationFn: (channelId) => apiClient.deleteChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "Success",
        description: "Channel deleted successfully!",
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

  return {
    channels: channelsQuery.data || [],
    isLoading: channelsQuery.isLoading,
    error: channelsQuery.error,
    addChannel: addChannelMutation.mutate,
    deleteChannel: deleteChannelMutation.mutate,
    isAddingChannel: addChannelMutation.isPending,
    isDeletingChannel: deleteChannelMutation.isPending,
  };
}
