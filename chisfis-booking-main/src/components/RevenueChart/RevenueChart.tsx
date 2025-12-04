import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import reportAPI, { RevenueReportDTO } from "api/report";

interface RevenueChartProps {
  year?: number;
  month?: number;
  chartType?: "line" | "bar";
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  year,
  month,
  chartType = "line",
}) => {
  const [data, setData] = useState<RevenueReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("📈 [RevenueChart] Loading data with filters:", { year, month });
        const revenueData = await reportAPI.getRevenueReport(year, month);
        console.log("📈 [RevenueChart] Received data:", revenueData);
        console.log("📈 [RevenueChart] Data count:", revenueData.length);
        setData(revenueData);
      } catch (err: any) {
        console.error("📈 [RevenueChart] Failed to load revenue data:", err);
        console.error("📈 [RevenueChart] Error response:", err.response?.data);
        setError(err.response?.data?.message || "Không thể tải dữ liệu doanh thu");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [year, month]);

  // Format số tiền cho tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Format period để hiển thị đẹp hơn
  const formatPeriod = (period: string) => {
    try {
      // Nếu là format "YYYY-MM"
      if (period.includes("-")) {
        const [year, month] = period.split("-");
        const monthNames = [
          "T1", "T2", "T3", "T4", "T5", "T6",
          "T7", "T8", "T9", "T10", "T11", "T12"
        ];
        return `${monthNames[parseInt(month) - 1]}/${year}`;
      }
      return period;
    } catch {
      return period;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-800 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {formatPeriod(label)}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Doanh thu: <span className="font-bold">{formatCurrency(payload[0].value)}</span>
          </p>
          {payload[0].payload.bookings !== undefined && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Đặt phòng: <span className="font-bold">{payload[0].payload.bookings}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
        <p>Không có dữ liệu doanh thu trong khoảng thời gian này</p>
      </div>
    );
  }

  // Chuẩn bị data cho chart
  const chartData = data.map((item) => {
    const formatted = {
      period: formatPeriod(item.period),
      revenue: item.revenue || 0,
      bookings: item.bookings || 0,
    };
    console.log("📈 [RevenueChart] Chart data item:", formatted);
    return formatted;
  });
  
  console.log("📈 [RevenueChart] Final chartData:", chartData);
  console.log("📈 [RevenueChart] ChartData length:", chartData.length);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Biểu đồ doanh thu
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {year && month
            ? `Tháng ${month}/${year}`
            : year
            ? `Năm ${year}`
            : "Tất cả thời gian"}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-300 dark:stroke-neutral-700" />
            <XAxis
              dataKey="period"
              className="text-neutral-600 dark:text-neutral-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-neutral-600 dark:text-neutral-400"
              tick={{ fill: "currentColor" }}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="revenue"
              fill="#10b981"
              name="Doanh thu (VNĐ)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-300 dark:stroke-neutral-700" />
            <XAxis
              dataKey="period"
              className="text-neutral-600 dark:text-neutral-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis
              className="text-neutral-600 dark:text-neutral-400"
              tick={{ fill: "currentColor" }}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              name="Doanh thu (VNĐ)"
              dot={{ fill: "#10b981", r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;

