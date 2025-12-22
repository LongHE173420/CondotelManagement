import React, { FC, useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { adminDashboardAPI, DashboardOverview, TopCondotel, TenantAnalytics } from "api/adminDashboard";
import { adminAPI } from "api/admin";
import PageAccountList from "containers/PageAccountList/PageAccountList";
import AccountPage from "containers/AccountPage/AccountPage";
import PageBlogList from "containers/PageManageBlog/PageBlogList";
import PageManageReviews from "containers/PageManageReviews/PageManageReviews";
import PageAdminRefund from "containers/PageAdminRefund/PageAdminRefund";
import PageAdminPayoutBooking from "containers/PageAdminPayoutBooking/PageAdminPayoutBooking";
import PageAdminLocations from "containers/PageAdminLocations/PageAdminLocations";
import PageAdminResorts from "containers/PageAdminResorts/PageAdminResorts";
import AdminPackagesPage from "containers/PageAdminPackages/AdminPackagesPage";
import PageAdminUtilities from "containers/PageAdminUtilities/PageAdminUtilities";
import PageAdminReports from "containers/PageAdminReports/PageAdminReports";
import PageChat from "containers/ChatPage/PageChat";
import { Link } from "react-router-dom";


export interface AdminPageProps {
  className?: string;
}

type AdminTab = "dashboard" | "accounts" | "profile" | "blog" | "reviews" | "refunds" | "payouts" | "locations" | "resorts" | "packages" | "utilities" | "reports" | "chat";

const AdminPage: FC<AdminPageProps> = ({ className = "" }) => {
  const { isAdmin, isLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminTab;
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam || "dashboard");

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && ["dashboard", "accounts", "profile", "blog", "reviews", "refunds", "payouts", "locations", "resorts", "packages", "utilities", "reports", "chat"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [topCondotels, setTopCondotels] = useState<TopCondotel[]>([]);
  const [tenantAnalytics, setTenantAnalytics] = useState<TenantAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (activeTab === "dashboard") {
      const loadDashboard = async () => {
        setLoading(true);
        setError("");

        try {
          const [overviewData, topData, analyticsData, allUsers] = await Promise.all([
            adminDashboardAPI.getOverview(),
            adminDashboardAPI.getTopCondotels(),
            adminDashboardAPI.getTenantAnalytics(),
            adminAPI.getAllUsers().catch(() => []), // Fallback: get users to count tenants
          ]);

          // Nếu totalTenants = 0, tính lại từ danh sách users
          let finalOverview = overviewData;
          if (overviewData.totalTenants === 0 && allUsers.length > 0) {
            const tenantCount = allUsers.filter(
              (user: any) => user.roleName === "Tenant" && (user.status === "Active" || user.status === "Hoạt động")
            ).length;

            if (tenantCount > 0) {
              finalOverview = {
                ...overviewData,
                totalTenants: tenantCount,
              };
            }
          }

          setOverview(finalOverview);
          setTopCondotels(topData);
          setTenantAnalytics(analyticsData);
        } catch (err: any) {
          let errorMessage = "Không thể tải dashboard. Vui lòng thử lại sau.";

          if (err.networkError || err.noResponse) {
            errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc đảm bảo backend đang chạy.";
          } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.message) {
            errorMessage = err.message;
          } else if (err.code === "ECONNREFUSED") {
            errorMessage = "Kết nối bị từ chối. Vui lòng kiểm tra xem backend server có đang chạy không.";
          } else if (err.code === "ERR_NETWORK") {
            errorMessage = "Lỗi mạng. Vui lòng kiểm tra kết nối internet.";
          }

          setError(errorMessage);

          // Set empty data on error
          setOverview({
            totalCondotels: 0,
            totalTenants: 0,
            totalBookings: 0,
            totalRevenue: 0,
          });
          setTopCondotels([]);
          setTenantAnalytics([]);
        } finally {
          setLoading(false);
        }
      };

      loadDashboard();
    } else {
      // Reset loading for other tabs
      setLoading(false);
    }
  }, [activeTab]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const StatCard = ({
    title,
    value,
    icon,
    gradient = "from-blue-500 to-blue-600",
    bgColor = "bg-blue-50 dark:bg-blue-900/20",
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    gradient?: string;
    bgColor?: string;
  }) => (
    <div className={`${bgColor} rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 dark:border-neutral-700/50`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-neutral-600 dark:text-neutral-300 text-sm font-semibold uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`bg-gradient-to-br ${gradient} text-white p-4 rounded-xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`nc-AdminPage ${className}`} data-nc-id="AdminPage">
      <Helmet>
        <title>Admin Dashboard || Fiscondotel</title>
      </Helmet>

      <div className="w-full">
        {/* Header Section */}
        <div className="mb-8 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-lg">
                Quản lý hệ thống Condotel
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-semibold">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation - Modern Design */}
        <div className="mb-8 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-2 border border-white/20 dark:border-neutral-700/50">
          <nav className="flex flex-wrap gap-2" aria-label="Tabs">
            <button
              onClick={() => handleTabChange("dashboard")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "dashboard"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </span>
            </button>
            <button
              onClick={() => handleTabChange("accounts")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "accounts"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Tài khoản
              </span>
            </button>
            <button
              onClick={() => handleTabChange("blog")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "blog"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Blog
              </span>
            </button>
            <button
              onClick={() => handleTabChange("reviews")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "reviews"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Review
              </span>
            </button>
            <button
              onClick={() => handleTabChange("refunds")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "refunds"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v4a3 3 0 003 3z" />
                </svg>
                Hoàn tiền
              </span>
            </button>
            <button
              onClick={() => handleTabChange("payouts")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "payouts"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Thanh toán Host
              </span>
            </button>
            <button
              onClick={() => handleTabChange("locations")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "locations"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Locations
              </span>
            </button>
            <button
              onClick={() => handleTabChange("resorts")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "resorts"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Resorts
              </span>
            </button>
            <button
              onClick={() => handleTabChange("packages")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "packages"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Gói Host
              </span>
            </button>
            <button
              onClick={() => handleTabChange("utilities")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "utilities"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Utilities
              </span>
            </button>
            <button
              onClick={() => handleTabChange("reports")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "reports"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Báo cáo
              </span>
            </button>
            <button
              onClick={() => handleTabChange("profile")}
              className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "profile"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </span>
            </button>
          </nav>
        </div>
        {/* --- Nút Chat Mới Thêm --- */}
        <button
          onClick={() => handleTabChange("chat")}
          className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "chat"
            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
        >
          <span className="flex items-center gap-2">
            {/* Icon Chat Bubble */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </span>
        </button>
        {/* ------------------------- */}

        {error && activeTab === "dashboard" && (
          <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  setError("");
                  setActiveTab("dashboard");
                  // Trigger reload by setting loading and calling useEffect
                  const loadDashboard = async () => {
                    setLoading(true);
                    setError("");
                    try {
                      const [overviewData, topData, analyticsData, allUsers] = await Promise.all([
                        adminDashboardAPI.getOverview(),
                        adminDashboardAPI.getTopCondotels(),
                        adminDashboardAPI.getTenantAnalytics(),
                        adminAPI.getAllUsers().catch(() => []), // Fallback
                      ]);

                      // Nếu totalTenants = 0, tính lại từ danh sách users
                      let finalOverview = overviewData;
                      if (overviewData.totalTenants === 0 && allUsers.length > 0) {
                        const tenantCount = allUsers.filter(
                          (user: any) => user.roleName === "Tenant" && (user.status === "Active" || user.status === "Hoạt động")
                        ).length;

                        if (tenantCount > 0) {
                          finalOverview = {
                            ...overviewData,
                            totalTenants: tenantCount,
                          };
                        }
                      }

                      setOverview(finalOverview);
                      setTopCondotels(topData);
                      setTenantAnalytics(analyticsData);
                    } catch (err: any) {
                      const errorMessage =
                        err.response?.data?.message ||
                        err.message ||
                        "Không thể tải dashboard. Vui lòng thử lại sau.";
                      setError(errorMessage);
                      setOverview({
                        totalCondotels: 0,
                        totalTenants: 0,
                        totalBookings: 0,
                        totalRevenue: 0,
                      });
                      setTopCondotels([]);
                      setTenantAnalytics([]);
                    } finally {
                      setLoading(false);
                    }
                  };
                  loadDashboard();
                }}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "packages" ? (
          <div className="py-8 lg:py-12 min-h-screen bg-gray-50">
            <div className="px-4 lg:px-8 xl:px-12">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-neutral-900">
                  Quản lý Gói Dịch Vụ Host
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-lg">
                  Xem danh sách gói đã mua • Kích hoạt thủ công cho Host
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <AdminPackagesPage />
              </div>
            </div>
          </div>
        ) : activeTab === "accounts" ? (
          <PageAccountList />
        ) : activeTab === "reviews" ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
              <PageManageReviews />
            </div>
          </div>
        ) : activeTab === "refunds" ? (
          <div className="space-y-6">
            <PageAdminRefund />
          </div>
        ) : activeTab === "payouts" ? (
          <div className="space-y-6">
            <PageAdminPayoutBooking />
          </div>
        ) : activeTab === "locations" ? (
          <div className="space-y-6">
            <PageAdminLocations />
          </div>
        ) : activeTab === "resorts" ? (
          <div className="space-y-6">
            <PageAdminResorts />
          </div>
        ) : activeTab === "utilities" ? (
          <div className="space-y-6">
            <PageAdminUtilities />
          </div>
        ) : activeTab === "reports" ? (
          <div className="space-y-6">
            <PageAdminReports />
          </div>
        ) : activeTab === "blog" ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Quản lý Blog
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Quản lý bài viết và danh mục blog
                  </p>
                </div>

              </div>
              <PageBlogList />
            </div>
          </div>
        ) : activeTab === "profile" ? (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Thông tin cá nhân
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Cập nhật ảnh đại diện và thông tin cá nhân
              </p>
            </div>
            <AccountPage noLayout={true} />
          </div>
        ) : activeTab === "chat" ? (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-xl h-[800px]">
            {/* Nhớ import PageChat ở trên đầu file nhé */}
            <PageChat />
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <>
                {/* Overview Stats */}
                {overview && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                      title="Tổng Condotels"
                      value={overview.totalCondotels}
                      icon={
                        <svg
                          className="w-7 h-7"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      }
                      gradient="from-blue-500 to-cyan-500"
                      bgColor="bg-blue-50 dark:bg-blue-900/20"
                    />
                    <StatCard
                      title="Tổng Tenants"
                      value={overview.totalTenants}
                      icon={
                        <svg
                          className="w-7 h-7"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      }
                      gradient="from-green-500 to-emerald-500"
                      bgColor="bg-green-50 dark:bg-green-900/20"
                    />
                    <StatCard
                      title="Tổng Bookings"
                      value={overview.totalBookings}
                      icon={
                        <svg
                          className="w-7 h-7"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                      }
                      gradient="from-purple-500 to-pink-500"
                      bgColor="bg-purple-50 dark:bg-purple-900/20"
                    />
                    <StatCard
                      title="Tổng Doanh Thu"
                      value={formatCurrency(overview.totalRevenue)}
                      icon={
                        <svg
                          className="w-7 h-7"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      }
                      gradient="from-orange-500 to-red-500"
                      bgColor="bg-orange-50 dark:bg-orange-900/20"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top Condotels */}
                  <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        🏆 Top Condotels
                      </h2>
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    {topCondotels.length > 0 ? (
                      <div className="space-y-4">
                        {topCondotels.slice(0, 5).map((condotel, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 dark:from-neutral-700 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${index === 0
                                  ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                  : index === 1
                                    ? "bg-gradient-to-br from-gray-400 to-gray-600"
                                    : index === 2
                                      ? "bg-gradient-to-br from-orange-500 to-red-600"
                                      : "bg-gradient-to-br from-blue-500 to-blue-600"
                                  }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {condotel.condotelName}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {condotel.bookingCount} bookings
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(condotel.totalRevenue)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 dark:text-neutral-400">
                        Chưa có dữ liệu
                      </p>
                    )}
                  </div>

                  {/* Tenant Analytics */}
                  <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        👥 Top Tenants
                      </h2>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    {tenantAnalytics.length > 0 ? (
                      <div className="space-y-4">
                        {tenantAnalytics.slice(0, 5).map((tenant, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 dark:from-neutral-700 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${index === 0
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                  : index === 1
                                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                                    : index === 2
                                      ? "bg-gradient-to-br from-purple-500 to-pink-600"
                                      : "bg-gradient-to-br from-orange-500 to-red-600"
                                  }`}
                              >
                                {tenant.tenantName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {tenant.tenantName}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {tenant.bookingCount} bookings
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(tenant.totalSpent)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 dark:text-neutral-400">
                        Chưa có dữ liệu
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
//hello 111