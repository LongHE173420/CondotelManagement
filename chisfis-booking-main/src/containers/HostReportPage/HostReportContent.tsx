import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import reportAPI, { HostReportDTO } from "api/report";

// StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
};

const HostReportContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<HostReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    // Check if user is Host
    if (!isAuthenticated || user?.roleName !== "Host") {
      navigate("/");
      return;
    }
    // Set default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
    const toDate = today.toISOString().split("T")[0];
    
    setDateFrom(fromDate);
    setDateTo(toDate);
    
    // Load report with default dates
    const loadInitialReport = async () => {
      setLoading(true);
      setError("");
      try {
        const reportData = await reportAPI.getReport(fromDate, toDate);
        setReport(reportData);
      } catch (err: any) {
        console.error("Failed to load report:", err);
        setError(err.response?.data?.message || "Không thể tải báo cáo");
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialReport();
  }, [isAuthenticated, user, navigate]);

  const loadReport = async () => {
    if (!dateFrom || !dateTo) return;
    
    // Validate date range
    if (new Date(dateTo) < new Date(dateFrom)) {
      setError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const reportData = await reportAPI.getReport(dateFrom, dateTo);
      setReport(reportData);
    } catch (err: any) {
      console.error("Failed to load report:", err);
      setError(err.response?.data?.message || "Không thể tải báo cáo");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount && amount !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString + "T00:00:00").toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Quick date range presets
  const quickDateRanges = [
    { label: "7 ngày qua", days: 7 },
    { label: "30 ngày qua", days: 30 },
    { label: "90 ngày qua", days: 90 },
    { label: "Năm nay", custom: () => {
      const today = new Date();
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return {
        from: yearStart.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    }},
  ];

  const applyQuickRange = (range: typeof quickDateRanges[0]) => {
    if (range.custom) {
      const dates = range.custom();
      handleDateRangeChange(dates.from, dates.to);
    } else if (range.days) {
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - range.days);
      handleDateRangeChange(
        fromDate.toISOString().split("T")[0],
        today.toISOString().split("T")[0]
      );
    }
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Báo cáo doanh thu</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Thống kê và phân tích doanh thu của bạn
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateRangeChange(e.target.value, dateTo)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateRangeChange(dateFrom, e.target.value)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              />
            </div>
            <button
              onClick={loadReport}
              className="mt-6 md:mt-0 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Tải báo cáo
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickDateRanges.map((range, index) => (
              <button
                key={index}
                onClick={() => applyQuickRange(range)}
                className="px-3 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {report && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Tổng doanh thu"
              value={formatCurrency(report.totalRevenue)}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="bg-green-500"
            />
            <StatCard
              title="Tổng đặt phòng"
              value={report.totalBookings || 0}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              color="bg-blue-500"
            />
            <StatCard
              title="Tổng khách hàng"
              value={report.totalCustomers || 0}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              color="bg-purple-500"
            />
            <StatCard
              title="Giá trị trung bình"
              value={formatCurrency(report.averageBookingValue)}
              subtitle="mỗi đặt phòng"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              color="bg-orange-500"
            />
          </div>

          {/* Booking Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Đang xử lý</p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">{report.pendingBookings || 0}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Đã xác nhận</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">{report.confirmedBookings || 0}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Hoàn thành</p>
                  <p className="mt-2 text-2xl font-bold text-purple-600">{report.completedBookings || 0}</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Đã hủy</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">{report.cancelledBookings || 0}</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Top Condotels */}
          {report.topCondotels && report.topCondotels.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Top căn hộ bán chạy
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                        Căn hộ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                        Số đặt phòng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {report.topCondotels.map((condotel, index) => (
                      <tr key={condotel.condotelId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          #{index + 1}. {condotel.condotelName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                          {condotel.bookings}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {formatCurrency(condotel.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Date Range Info */}
          {report.dateFrom && report.dateTo && (
            <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              Báo cáo từ {formatDate(report.dateFrom)} đến {formatDate(report.dateTo)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HostReportContent;

