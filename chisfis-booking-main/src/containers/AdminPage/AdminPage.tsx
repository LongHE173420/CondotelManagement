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
import { Link } from "react-router-dom";

export interface AdminPageProps {
  className?: string;
}

type AdminTab = "dashboard" | "accounts" | "profile" | "blog" | "reviews" | "refunds" | "payouts" | "locations" | "resorts";

const AdminPage: FC<AdminPageProps> = ({ className = "" }) => {
  const { isAdmin, isLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminTab;
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam || "dashboard");

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && ["dashboard", "accounts", "profile", "blog", "reviews", "refunds", "payouts", "locations", "resorts"].includes(tabParam)) {
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
          console.error("Failed to load dashboard:", err);
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
    color = "bg-blue-500",
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
            {title}
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
            {value}
          </p>
        </div>
        <div className={`${color} text-white p-4 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className={`nc-AdminPage ${className}`} data-nc-id="AdminPage">
      <Helmet>
        <title>Admin Dashboard || Fiscondotel</title>
      </Helmet>

      <div className="container py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
            Admin Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Quản lý hệ thống Condotel
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-neutral-200 dark:border-neutral-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleTabChange("accounts")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "accounts"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Quản lý Tài khoản
            </button>
            <button
              onClick={() => handleTabChange("blog")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "blog"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Quản lý Blog
            </button>
            <button
              onClick={() => handleTabChange("reviews")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reviews"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Quản lý Review
            </button>
            <button
              onClick={() => handleTabChange("refunds")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "refunds"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              💰 Quản lý Hủy phòng & Hoàn tiền
            </button>
            <button
              onClick={() => handleTabChange("payouts")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "payouts"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              💵 Thanh toán cho Host
            </button>
            <button
              onClick={() => handleTabChange("locations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "locations"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              📍 Locations
            </button>
            <button
              onClick={() => handleTabChange("resorts")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "resorts"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              🏨 Resorts
            </button>
            <button
              onClick={() => handleTabChange("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
            >
              Profile
            </button>
          </nav>
        </div>

        {error && activeTab === "dashboard" && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
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
                      console.error("Failed to load dashboard:", err);
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
        {activeTab === "accounts" ? (
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
                <div className="flex gap-3">
                  <Link
                    to="/manage-blog/categories"
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Quản lý Danh mục
                  </Link>
                  <Link
                    to="/manage-blog/add"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    + Thêm bài viết
                  </Link>
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
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                  className="w-6 h-6"
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
              color="bg-blue-500"
            />
            <StatCard
              title="Tổng Tenants"
              value={overview.totalTenants}
              icon={
                <svg
                  className="w-6 h-6"
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
              color="bg-green-500"
            />
            <StatCard
              title="Tổng Bookings"
              value={overview.totalBookings}
              icon={
                <svg
                  className="w-6 h-6"
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
              color="bg-purple-500"
            />
            <StatCard
              title="Tổng Doanh Thu"
              value={formatCurrency(overview.totalRevenue)}
              icon={
                <svg
                  className="w-6 h-6"
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
              color="bg-orange-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Condotels */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              🏆 Top Condotels
            </h2>
            {topCondotels.length > 0 ? (
              <div className="space-y-4">
                {topCondotels.slice(0, 5).map((condotel, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-orange-600"
                            : "bg-blue-500"
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
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              👥 Top Tenants
            </h2>
            {tenantAnalytics.length > 0 ? (
              <div className="space-y-4">
                {tenantAnalytics.slice(0, 5).map((tenant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0
                            ? "bg-blue-500"
                            : index === 1
                            ? "bg-green-500"
                            : index === 2
                            ? "bg-purple-500"
                            : "bg-orange-500"
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
