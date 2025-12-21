import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI, UserProfile } from "api/auth";
import axiosClient from "api/axiosClient";
import { packageAPI, HostPackageDetailsDto } from "api/package";

// === 1. ĐỊNH NGHĨA CONTEXT TYPE ===
interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  hostPackage: HostPackageDetailsDto | null;
  isLoading: boolean; // Đang khởi tạo auth
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  reloadUser: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// === 2. AUTH PROVIDER ===
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hostPackage, setHostPackage] = useState<HostPackageDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // === KHỞI TẠO AUTH KHI APP LOAD ===
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check localStorage for existing token
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          const userProfile = JSON.parse(storedUser);
          setUser(userProfile);
          
          // Verify token is still valid by calling getMe
          try {
            const freshUser = await authAPI.getMe();
            setUser(freshUser);
            
            // CHỈ gọi packageAPI.getMyPackage() KHI USER LÀ HOST
            if (freshUser.roleName === "Host") {
              try {
                const pkg = await packageAPI.getMyPackage();
                setHostPackage(pkg);
              } catch (pkgError: any) {
                if (pkgError.response?.status === 400 || pkgError.response?.status === 404) {
                  setHostPackage(null);
                }
              }
            } else {
              setHostPackage(null);
            }
          } catch (e) {
            // Token is invalid, clear localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
            setHostPackage(null);
          }
        }
      } catch (error: any) {
        // Not authenticated or error fetching user
        setUser(null);
        setHostPackage(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // === LOGIN ===
  const login = (token: string, newUser: UserProfile) => {
    setToken(token);
    setUser(newUser);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(newUser));

    // Load package if Host
    if (newUser.roleName === "Host") {
      packageAPI.getMyPackage()
        .then(setHostPackage)
        .catch(err => {
          if (err.response?.status === 400 || err.response?.status === 404) {
            setHostPackage(null);
          }
        });
    } else {
      setHostPackage(null);
    }
  };

  // === LOGOUT ===
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Logout request failed but continue with local cleanup
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setHostPackage(null);

    // Redirect to login
    window.location.href = "/login";
  };

  // === RELOAD USER ===
  const reloadUser = async () => {
    try {
      const userProfile = await authAPI.getMe();
      setUser(userProfile);

      if (userProfile.roleName === "Host") {
        try {
          const pkg = await packageAPI.getMyPackage();
          setHostPackage(pkg);
        } catch (err: any) {
          if (err.response?.status === 400 || err.response?.status === 404) {
            setHostPackage(null);
          }
        }
      } else {
        setHostPackage(null);
      }
    } catch (error) {
      // Failed to reload user - probably not authenticated
      handleLogout();
    }
  };

  // === UPDATE USER ===
  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // === GIÁ TRỊ CUNG CẤP ===
  const value: AuthContextType = {
    user,
    token,
    hostPackage,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.roleName === "Admin",
    login,
    logout: handleLogout,
    reloadUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};