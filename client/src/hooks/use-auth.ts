import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { secureApiRequest } from "@/lib/session-utils";
import type { LoginData, ChangePasswordData } from "@shared/schema";

interface User {
  id: number;
  username: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        console.log('Fetching user session...');
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        console.log('Auth response status:', response.status);
        if (response.status === 401) {
          console.log('User not authenticated');
          return null;
        }
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        const userData = await response.json();
        console.log('User authenticated:', userData);
        return userData;
      } catch (error) {
        console.error('Auth check error:', error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      console.log('Attempting password change...');
      
      // Simple approach: if user is logged in (user exists), make the request directly
      if (!user) {
        throw new Error('You must be logged in to change your password. Please log in first.');
      }
      
      console.log('User is authenticated, making password change request');
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      console.log('Password changed successfully');
      // Refresh session after password change
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });

  const verifyPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-password", { password });
      return response.json();
    },
  });

  const refreshSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/refresh-session");
      return response.json();
    },
    onSuccess: () => {
      // Refresh user data after session refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Session info query for debugging
  const { data: sessionInfo } = useQuery({
    queryKey: ["/api/auth/session-info"],
    queryFn: async () => {
      const response = await fetch("/api/auth/session-info", {
        credentials: "include"
      });
      return response.json();
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    sessionInfo,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    verifyPassword: verifyPasswordMutation.mutateAsync,
    refreshSession: refreshSessionMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isChangePasswordPending: changePasswordMutation.isPending,
    isVerifyPasswordPending: verifyPasswordMutation.isPending,
    isRefreshSessionPending: refreshSessionMutation.isPending,
  };
}
