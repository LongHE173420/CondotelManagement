import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import reportAPI, { HostReportDTO } from "api/report";
import RevenueChart from "components/RevenueChart/RevenueChart";

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
    <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-neutral-800 dark:to-blue-900/10 rounded-2xl shadow-xl p-6 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{value}</p>
          {subtitle && (
            <p className="mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
        <div className={`${color} p-4 rounded-xl shadow-lg`}>{icon}</div>
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
  const [chartYear, setChartYear] = useState<number | undefined>(new Date().getFullYear());
  const [chartMonth, setChartMonth] = useState<number | undefined>(undefined);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

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
    { label: "Hôm nay", custom: () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      return { from: todayStr, to: todayStr };
    }},
    { label: "7 ngày qua", days: 7 },
    { label: "30 ngày qua", days: 30 },
    { label: "90 ngày qua", days: 90 },
    { label: "Tháng này", custom: () => {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from: monthStart.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    }},
    { label: "Tháng trước", custom: () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        from: lastMonth.toISOString().split("T")[0],
        to: lastMonthEnd.toISOString().split("T")[0],
      };
    }},
    { label: "Năm nay", custom: () => {
      const today = new Date();
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return {
        from: yearStart.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    }},
    { label: "Năm trước", custom: () => {
      const today = new Date();
      const lastYear = today.getFullYear() - 1;
      const yearStart = new Date(lastYear, 0, 1);
      const yearEnd = new Date(lastYear, 11, 31);
      return {
        from: yearStart.toISOString().split("T")[0],
        to: yearEnd.toISOString().split("T")[0],
      };
    }},
  ];

  const applyQuickRange = async (range: typeof quickDateRanges[0]) => {
    let fromDate = "";
    let toDate = "";
    
    if (range.custom) {
      const dates = range.custom();
      fromDate = dates.from;
      toDate = dates.to;
    } else if (range.days) {
      const today = new Date();
      const from = new Date(today);
      from.setDate(today.getDate() - range.days);
      fromDate = from.toISOString().split("T")[0];
      toDate = today.toISOString().split("T")[0];
    }
    
    setDateFrom(fromDate);
    setDateTo(toDate);
    
    // Auto-load report when quick range is selected
    setLoading(true);
    setError("");
    try {
      const reportData = await reportAPI.getReport(fromDate, toDate);
      setReport(reportData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải báo cáo");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Báo cáo doanh thu
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Thống kê và phân tích doanh thu của bạn
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-neutral-800 dark:to-blue-900/10 rounded-2xl shadow-xl p-6 mb-6 border border-blue-200/50 dark:border-blue-800/50">
        <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Lọc theo ngày
        </h3>
        <div className="flex flex-col gap-4">
          {/* Quick Date Ranges */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">
              Chọn nhanh:
            </label>
            <div className="flex flex-wrap gap-2">
              {quickDateRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickRange(range)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Hoặc chọn khoảng thời gian tùy chỉnh:
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateRangeChange(e.target.value, dateTo)}
                  max={dateTo || undefined}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateRangeChange(dateFrom, e.target.value)}
                  min={dateFrom || undefined}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>
              <button
                onClick={loadReport}
                disabled={loading || !dateFrom || !dateTo}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tải...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Tải báo cáo
                  </span>
                )}
              </button>
            </div>
            {dateFrom && dateTo && (
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Đã chọn: {formatDate(dateFrom)} - {formatDate(dateTo)}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Revenue Chart Section - Always show, independent of report */}
      <div className="mb-6">
            <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-neutral-800 dark:to-blue-900/10 rounded-2xl shadow-xl p-6 mb-4 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Năm
                    </label>
                    <select
                      value={chartYear || ""}
                      onChange={(e) => {
                        const year = e.target.value ? parseInt(e.target.value) : undefined;
                        setChartYear(year);
                        // Reset month when year changes
                        if (year) {
                          setChartMonth(undefined);
                        }
                      }}
                      className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="">Tất cả</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  {chartYear && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Tháng
                      </label>
                      <select
                        value={chartMonth || ""}
                        onChange={(e) => {
                          const month = e.target.value ? parseInt(e.target.value) : undefined;
                          setChartMonth(month);
                        }}
                        className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                      >
                        <option value="">Tất cả tháng</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <option key={month} value={month}>
                            Tháng {month}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Loại biểu đồ
                    </label>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as "line" | "bar")}
                      className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="line">Đường</option>
                      <option value="bar">Cột</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <RevenueChart year={chartYear} month={chartMonth} chartType={chartType} />
      </div>

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
            <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-neutral-800 dark:to-blue-900/10 rounded-2xl shadow-xl p-6 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">Đang xử lý</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{report.pendingBookings || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-green-50/30 dark:from-neutral-800 dark:to-green-900/10 rounded-2xl shadow-xl p-6 border border-green-200/50 dark:border-green-800/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">Đã xác nhận</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{report.confirmedBookings || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-purple-50/30 dark:from-neutral-800 dark:to-purple-900/10 rounded-2xl shadow-xl p-6 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">Hoàn thành</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{report.completedBookings || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-red-50/30 dark:from-neutral-800 dark:to-red-900/10 rounded-2xl shadow-xl p-6 border border-red-200/50 dark:border-red-800/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">Đã hủy</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{report.totalCancellations ?? report.cancelledBookings ?? 0}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-orange-500 p-4 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Top Condotels */}
          {report.topCondotels && report.topCondotels.length > 0 && (
            <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-neutral-800 dark:to-blue-900/10 rounded-2xl shadow-xl p-6 mb-6 border border-blue-200/50 dark:border-blue-800/50">
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
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

