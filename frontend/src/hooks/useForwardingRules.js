import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";
import { useToast } from "@/components/ui/use-toast";

export function useForwardingRules() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const rulesQuery = useQuery({
    queryKey: ["forwardingRules"],
    queryFn: () => apiClient.getForwardingRules(),
  });

  const createRuleMutation = useMutation({
    mutationFn: (ruleData) => apiClient.createForwardingRule(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forwardingRules"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "Success",
        description: "Forwarding rule created successfully!",
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

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, ruleData }) =>
      apiClient.updateForwardingRule(ruleId, ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forwardingRules"] });
      toast({
        title: "Success",
        description: "Forwarding rule updated successfully!",
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

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId) => apiClient.deleteForwardingRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forwardingRules"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "Success",
        description: "Forwarding rule deleted successfully!",
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

  const toggleRuleMutation = useMutation({
    mutationFn: (ruleId) => apiClient.toggleRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forwardingRules"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "Success",
        description: "Rule status updated successfully!",
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
    rules: rulesQuery.data || [],
    isLoading: rulesQuery.isLoading,
    error: rulesQuery.error,
    createRule: createRuleMutation.mutate,
    updateRule: updateRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    toggleRule: toggleRuleMutation.mutate,
    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
    isToggling: toggleRuleMutation.isPending,
  };
}
