import React, { FC, ReactNode, useState } from "react";
import { useAuth } from "contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

interface HostLayoutProps {
  children: ReactNode;
}

const HostLayout: FC<HostLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: null,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.roleName !== "Host") {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: "Đăng xuất",
      message: "Bạn có chắc chắn muốn đăng xuất?",
      action: async () => {
        await logout();
        setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        navigate("/");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Host Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md shadow-lg border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Link to="/host-dashboard" className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Host Dashboard
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Fiscondotel</p>
                </div>
              </Link>
            </div>

            {/* Right Side - User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              {user && (
                <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.fullName?.charAt(0).toUpperCase() || "H"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {user.fullName || "Host"}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}

              {/* Home Button */}
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="hidden sm:inline">Trang chủ</span>
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl p-6 max-w-sm w-11/12">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", action: null })}
                className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => confirmModal.action?.()}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostLayout;


