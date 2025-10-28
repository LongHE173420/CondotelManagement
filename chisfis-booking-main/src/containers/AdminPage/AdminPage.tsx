import React, { FC, useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { adminDashboardAPI, DashboardOverview, TopCondotel, TenantAnalytics } from "api/adminDashboard";

export interface AdminPageProps {
  className?: string;
}

const AdminPage: FC<AdminPageProps> = ({ className = "" }) => {
  const { isAdmin, isLoading } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [topCondotels, setTopCondotels] = useState<TopCondotel[]>([]);
  const [tenantAnalytics, setTenantAnalytics] = useState<TenantAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [overviewData, topData, analyticsData] = await Promise.all([
          adminDashboardAPI.getOverview(),
          adminDashboardAPI.getTopCondotels(),
          adminDashboardAPI.getTenantAnalytics(),
        ]);

        setOverview(overviewData);
        setTopCondotels(topData);
        setTenantAnalytics(analyticsData);
      } catch (err: any) {
        console.error("Failed to load dashboard:", err);
        setError(err.response?.data?.message || "Không thể tải dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`nc-AdminPage ${className}`} data-nc-id="AdminPage">
      <Helmet>
        <title>Admin Dashboard || Booking React Template</title>
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

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

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
      </div>
    </div>
  );
};

export default AdminPage;
