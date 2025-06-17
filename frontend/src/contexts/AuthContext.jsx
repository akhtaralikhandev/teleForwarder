import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set token in API client when it changes
  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      localStorage.setItem("token", token);
    } else {
      apiClient.setToken(null);
      localStorage.removeItem("token");
    }
  }, [token]);

  // Query for current user data
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => apiClient.getCurrentUser(),
    enabled: !!token,
    retry: (failureCount, error) => {
      if (error?.status === 401) {
        setToken(null);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (email) => apiClient.login(email),
    onSuccess: (data) => {
      setToken(data.access_token);
      queryClient.setQueryData(["currentUser"], data);
      toast({
        title: "Success",
        description: "Welcome back!",
      });
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData) => apiClient.register(userData),
    onSuccess: (data) => {
      setToken(data.access_token);
      queryClient.setQueryData(["currentUser"], data);
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    setToken(null);
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  const value = {
    user,
    isLoading:
      isLoading || loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
