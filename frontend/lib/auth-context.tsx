"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "./api-client";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const checkAuth = async () => {
    if (typeof window === 'undefined') return;

    try {
      setLoading(true);
      const response = await authApi.getCurrentUser();

      if (response.success) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    const initAuth = () => {
      if (typeof window !== 'undefined') {
        checkAuth();
      }
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        // @ts-ignore
        window.requestIdleCallback(initAuth);
      } else {
        setTimeout(initAuth, 200);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authApi.login({ email, password });

      if (response.success) {
        await checkAuth();
        toast.success("Login successful");
        router.push("/dashboard");
        return { success: true };
      } else {
        // Let the component handle the error message
        return response;
      }
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        message: "Login failed. Please try again."
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);

      if (response.success) {
        let message = response.message;
        let redirectPath = "/login?registered=true";
        
        // If email wasn't sent, add more detailed instructions
        if (response.data?.emailSent === false) {
          message = 'Registration successful but we could not send a verification email. Please contact support to verify your account.';
          redirectPath += "&no_verification=true";
        }
        
        toast.success(message);
        router.push(redirectPath);
      } else {
        toast.error(response.message || "Registration failed. Please ensure the backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const response = await authApi.logout();

      if (response.success) {
        setUser(null);
        toast.success("Logged out successfully");
        router.push("/");
      } else {
        toast.error(response.message || "Logout failed");
        // Force logout on client side even if server request fails
        setUser(null);
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized && typeof window !== 'undefined') {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}; 