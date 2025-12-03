import React, { useState, useEffect } from "react";
import { useAuth } from "contexts/AuthContext";
import payoutAPI, { HostPayoutDTO } from "api/payout";
import moment from "moment";

const HostPayoutContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [pendingPayouts, setPendingPayouts] = useState<HostPayoutDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPendingPayouts = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await payoutAPI.getPendingPayouts();
        setPendingPayouts(data);
        console.log("💰 Pending payouts loaded:", data);
      } catch (err: any) {
        console.error("Failed to load pending payouts:", err);
        setError(err.response?.data?.message || "Không thể tải danh sách booking chờ thanh toán");
        setPendingPayouts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPendingPayouts();
  }, []);

  // Format số tiền
  const formatPrice = (price: number | undefined): string => {
    if (!price) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format ngày tháng
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      return moment(dateString).format("DD/MM/YYYY");
    } catch {
      return dateString;
    }
  };

  // Tính tổng tiền chờ thanh toán
  const totalPendingAmount = pendingPayouts.reduce((sum, payout) => sum + (payout.totalPrice || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Thanh toán cho Host</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Danh sách booking đã hoàn thành và chờ thanh toán (sau 15 ngày kể từ ngày kết thúc)
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Tổng tiền chờ thanh toán</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {formatPrice(totalPendingAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Số booking chờ thanh toán</p>
            <p className="text-3xl font-bold text-neutral-700 dark:text-neutral-300 mt-2">
              {pendingPayouts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Pending Payouts Table */}
      {pendingPayouts.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Không có booking chờ thanh toán
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Tất cả booking đã hoàn thành đã được thanh toán hoặc chưa đủ 15 ngày kể từ ngày kết thúc.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Căn hộ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Ngày check-in / check-out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Ngày hoàn thành
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Số ngày chờ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {pendingPayouts.map((payout) => (
                  <tr key={payout.bookingId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      #{payout.bookingId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {payout.condotelName || `Condotel #${payout.condotelId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {payout.customerName || `Customer #${payout.customerId}`}
                        </div>
                        {payout.customerEmail && (
                          <div className="text-xs text-neutral-400">{payout.customerEmail}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      <div>
                        <div>{formatDate(payout.startDate)}</div>
                        <div className="text-xs text-neutral-400">đến {formatDate(payout.endDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatPrice(payout.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDate(payout.completedAt || payout.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                        {payout.daysSinceCompleted !== undefined
                          ? `${payout.daysSinceCompleted} ngày`
                          : "Đang tính"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Thông tin về thanh toán
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Booking sẽ được thanh toán sau 15 ngày kể từ ngày kết thúc (EndDate)</li>
                <li>Chỉ booking có status "Completed" mới được thanh toán</li>
                <li>Booking không có refund request đang pending/approved mới được thanh toán</li>
                <li>Admin sẽ xử lý thanh toán hàng ngày hoặc theo yêu cầu</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostPayoutContent;

