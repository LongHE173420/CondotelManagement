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

  // Initialize from localStorage and fetch full user profile
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          setUser(parsedUser);
          
          // Gọi /Auth/me để lấy đầy đủ thông tin user (bao gồm imageUrl) từ database
          try {
            const fullUserProfile = await authAPI.getMe();
            console.log("✅ Loaded full user profile with avatar:", fullUserProfile);
            console.log("🖼️ Avatar URL from API:", fullUserProfile.imageUrl);
            
            // Cập nhật user state và localStorage
            setUser(fullUserProfile);
            localStorage.setItem("user", JSON.stringify(fullUserProfile));
            
            // Log để debug
            if (fullUserProfile.imageUrl) {
              console.log("✅ Avatar URL is set:", fullUserProfile.imageUrl);
            } else {
              console.warn("⚠️ No avatar URL in user profile");
            }
          } catch (meError: any) {
            console.warn("⚠️ Failed to refresh user profile, using cached data:", meError);
            // Nếu /Auth/me fail (token expired, etc.), vẫn dùng user từ localStorage
            // Nhưng có thể token đã hết hạn, nên sẽ được xử lý bởi axios interceptor
          }
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
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
      // Gọi API logout để backend xử lý (works for all roles: Admin, Host, Tenant)
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await authAPI.logout();
          console.log("✅ Logout API called successfully");
        } catch (error) {
          // Nếu API logout fail, vẫn tiếp tục logout ở frontend
          // Điều này đảm bảo logout vẫn hoạt động ngay cả khi backend có vấn đề
          console.warn("⚠️ Logout API failed, continuing with frontend logout:", error);
        }
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Luôn xóa token và user data cho mọi role (Admin, Host, Tenant)
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      
      // Clear any other auth-related data if exists
      // This ensures complete logout for all roles
      
      console.log("✅ User logged out successfully (all roles supported)");
      
      // Force redirect to login page (works for all roles)
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



