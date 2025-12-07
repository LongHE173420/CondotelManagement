import React, { useState, useEffect } from "react";
import { useAuth } from "contexts/AuthContext";
import payoutAPI, { HostPayoutDTO } from "api/payout";
import moment from "moment";

type PayoutTab = "pending" | "paid";

const HostPayoutContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PayoutTab>("pending");
  const [pendingPayouts, setPendingPayouts] = useState<HostPayoutDTO[]>([]);
  const [paidPayouts, setPaidPayouts] = useState<HostPayoutDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");

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

  const loadPaidPayouts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await payoutAPI.getPaidPayouts({
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
      });
      setPaidPayouts(data);
      console.log("💰 Paid payouts loaded:", data, "filters:", { filterFromDate, filterToDate });
    } catch (err: any) {
      console.error("Failed to load paid payouts:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách booking đã thanh toán");
      setPaidPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending") {
      loadPendingPayouts();
    } else {
      loadPaidPayouts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterFromDate, filterToDate]);

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

  // Get current payouts based on active tab
  const currentPayouts = activeTab === "pending" ? pendingPayouts : paidPayouts;
  const totalAmount = currentPayouts.reduce((sum, payout) => sum + (payout.amount || payout.totalPrice || 0), 0);

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
      <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Quản lý thanh toán
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {activeTab === "pending" 
            ? "Danh sách booking đã hoàn thành và chờ thanh toán (sau 15 ngày kể từ ngày kết thúc)"
            : "Lịch sử các booking đã được thanh toán"}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-orange-200/50 dark:border-orange-800/50 overflow-hidden">
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === "pending"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
          >
            Chờ thanh toán ({pendingPayouts.length})
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === "paid"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
          >
            Đã thanh toán ({paidPayouts.length})
          </button>
        </div>
      </div>

      {/* Date Filters - Only show for Paid tab */}
      {activeTab === "paid" && (
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-orange-200/50 dark:border-orange-800/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Từ ngày:
              </label>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Đến ngày:
              </label>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:text-neutral-100"
              />
            </div>
            <div className="flex items-end">
              {(filterFromDate || filterToDate) && (
                <button
                  onClick={() => {
                    setFilterFromDate("");
                    setFilterToDate("");
                  }}
                  className="w-full px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-white to-orange-50/30 dark:from-neutral-800 dark:to-orange-900/10 rounded-2xl shadow-xl p-6 mb-6 border border-orange-200/50 dark:border-orange-800/50">
        <div className="flex items-center justify-between">
          <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl p-4 flex-1 mr-4">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
              {activeTab === "pending" ? "Tổng tiền chờ thanh toán" : "Tổng tiền đã thanh toán"}
            </p>
            <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mt-2">
              {formatPrice(totalAmount)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-4 flex-1 text-right">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {activeTab === "pending" ? "Số booking chờ thanh toán" : "Số booking đã thanh toán"}
            </p>
            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mt-2">
              {currentPayouts.length}
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

      {/* Payouts Table */}
      {currentPayouts.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-orange-50/30 dark:from-neutral-800 dark:to-orange-900/10 rounded-2xl shadow-xl border border-orange-200/50 dark:border-orange-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {activeTab === "pending" 
              ? "Không có booking chờ thanh toán"
              : "Không có booking đã thanh toán"}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {activeTab === "pending"
              ? "Tất cả booking đã hoàn thành đã được thanh toán hoặc chưa đủ 15 ngày kể từ ngày kết thúc."
              : "Không có booking nào đã được thanh toán trong khoảng thời gian đã chọn."}
          </p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-orange-200/50 dark:border-orange-800/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-neutral-700 dark:to-neutral-800 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Căn hộ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Ngày check-in / check-out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    {activeTab === "pending" ? "Ngày hoàn thành" : "Ngày thanh toán"}
                  </th>
                  {activeTab === "pending" && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                      Số ngày chờ
                    </th>
                  )}
                  {activeTab === "paid" && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                      Trạng thái
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {currentPayouts.map((payout) => (
                  <tr key={payout.bookingId} className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-neutral-700/50 dark:hover:to-neutral-800/50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      #{payout.bookingId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {payout.condotelName || `Condotel #${payout.condotelId}`}
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(payout.amount || payout.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {activeTab === "pending" 
                        ? formatDate(payout.completedAt || payout.endDate)
                        : formatDate(payout.paidAt || payout.paidToHostAt)}
                    </td>
                    {activeTab === "pending" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                          {payout.daysSinceCompleted !== undefined
                            ? `${payout.daysSinceCompleted} ngày`
                            : "Đang tính"}
                        </span>
                      </td>
                    )}
                    {activeTab === "paid" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                          Đã thanh toán
                        </span>
                      </td>
                    )}
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

