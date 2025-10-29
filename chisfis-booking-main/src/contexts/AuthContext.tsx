import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile } from "api/auth";
import { authAPI } from "api/auth";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: UserProfile) => {
    // Đảm bảo token không có "Bearer" prefix khi lưu vào localStorage
    // (Axios interceptor sẽ tự động thêm "Bearer" khi gửi request)
    const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
    localStorage.setItem("token", cleanToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    
    console.log("✅ Token saved to localStorage (without Bearer prefix)");
  };

  const logout = async () => {
    try {
      // Gọi API logout để backend xử lý (optional - nếu API có)
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await authAPI.logout();
          console.log("✅ Logout API called successfully");
        } catch (error) {
          // Nếu API logout fail, vẫn tiếp tục logout ở frontend
          console.warn("⚠️ Logout API failed, continuing with frontend logout:", error);
        }
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Luôn xóa token và user data, redirect về login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      console.log("✅ User logged out, redirecting to login...");
      
      // Force redirect to login page
      window.location.href = "/login";
    }
  };

  const updateUser = (userData: UserProfile) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.roleName === "Admin",
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



