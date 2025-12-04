import React, { useState, useEffect } from "react";
import payoutAPI, { HostPayoutDTO, ProcessPayoutResponse } from "api/payout";
import { adminAPI, AdminUserDTO } from "api/admin";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import moment from "moment";

interface HostOption {
  hostId: number;
  fullName: string;
  email: string;
}

const PageAdminPayoutBooking: React.FC = () => {
  const [pendingPayouts, setPendingPayouts] = useState<HostPayoutDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingAll, setProcessingAll] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterHostId, setFilterHostId] = useState<number | undefined>(undefined);
  const [hosts, setHosts] = useState<HostOption[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);

  const loadPendingPayouts = async () => {
    setLoading(true);
    setError("");
    try {
      // Admin API - xem tất cả booking chờ thanh toán (có thể filter theo hostId)
      const data = await payoutAPI.getAdminPendingPayouts(filterHostId);
      setPendingPayouts(data);
      console.log("💰 Admin pending payouts loaded:", data, "filterHostId:", filterHostId);
    } catch (err: any) {
      console.error("Failed to load pending payouts:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách booking chờ thanh toán");
      setPendingPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách hosts
  useEffect(() => {
    const loadHosts = async () => {
      setLoadingHosts(true);
      try {
        const users = await adminAPI.getAllUsers();
        // Filter chỉ lấy users có roleName là "Host"
        const hostUsers = users
          .filter((user: AdminUserDTO) => user.roleName === "Host")
          .map((user: AdminUserDTO) => ({
            hostId: user.userId,
            fullName: user.fullName,
            email: user.email || "",
          }));
        setHosts(hostUsers);
      } catch (err: any) {
        console.error("Failed to load hosts:", err);
      } finally {
        setLoadingHosts(false);
      }
    };
    loadHosts();
  }, []);

  useEffect(() => {
    loadPendingPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterHostId]);

  const handleProcessPayout = async (bookingId: number) => {
    if (!window.confirm(`Xác nhận xử lý thanh toán cho booking #${bookingId}?`)) {
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      // Admin API - xác nhận và xử lý payout
      const result = await payoutAPI.confirmPayout(bookingId);
      console.log("✅ Payout confirmed and processed:", result);
      
      if (result.success) {
        setSuccess(result.message || `Đã xác nhận và xử lý thanh toán cho booking #${bookingId} thành công`);
        // Reload danh sách
        await loadPendingPayouts();
      } else {
        setError(result.message || "Không thể xử lý thanh toán");
      }
    } catch (err: any) {
      console.error("Failed to confirm payout:", err);
      setError(err.response?.data?.message || "Không thể xử lý thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    if (!window.confirm("Xác nhận xử lý thanh toán cho TẤT CẢ booking đủ điều kiện?")) {
      return;
    }

    setProcessingAll(true);
    setError("");
    setSuccess("");

    try {
      // Admin API - xử lý tất cả booking đủ điều kiện
      const result = await payoutAPI.processAllPayouts();
      console.log("✅ All payouts processed (Admin):", result);
      
      if (result.success) {
        setSuccess(
          result.message || 
          `Đã xử lý ${result.processedCount || result.processedBookings || 0} booking với tổng tiền ${result.totalAmount?.toLocaleString("vi-VN") || 0} đ`
        );
        // Reload danh sách
        await loadPendingPayouts();
      } else {
        setError(result.message || "Không thể xử lý thanh toán");
      }
    } catch (err: any) {
      console.error("Failed to process all payouts:", err);
      setError(err.response?.data?.message || "Không thể xử lý thanh toán");
    } finally {
      setProcessingAll(false);
    }
  };

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
  const totalPendingAmount = pendingPayouts.reduce((sum, payout) => sum + (payout.amount || payout.totalPrice || 0), 0);

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
        <h2 className="text-2xl font-bold">Xử lý thanh toán cho Host</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Xử lý thanh toán cho các booking đã hoàn thành và đủ 15 ngày kể từ ngày kết thúc
        </p>
      </div>

      {/* Filter by Host */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
            Lọc theo Host:
          </label>
          {loadingHosts ? (
            <div className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700 w-64">
              <span className="text-sm text-neutral-500">Đang tải danh sách host...</span>
            </div>
          ) : (
            <select
              value={filterHostId || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFilterHostId(value ? parseInt(value) : undefined);
              }}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100 w-64"
            >
              <option value="">-- Tất cả Host --</option>
              {hosts.map((host) => (
                <option key={host.hostId} value={host.hostId}>
                  {host.fullName} {host.email ? `(${host.email})` : ""}
                </option>
              ))}
            </select>
          )}
          {filterHostId && (
            <button
              onClick={() => setFilterHostId(undefined)}
              className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
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
          <div className="text-right">
            <ButtonPrimary
              onClick={handleProcessAll}
              disabled={processingAll || pendingPayouts.length === 0}
              className="min-w-[200px]"
            >
              {processingAll ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                "Xử lý tất cả"
              )}
            </ButtonPrimary>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

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
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Căn hộ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Ngày hoàn thành
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Số ngày chờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Thông tin ngân hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Hành động
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
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {payout.hostName || `Host #${payout.hostId || 'N/A'}`}
                        </div>
                        {payout.hostId && (
                          <div className="text-xs text-neutral-400">ID: {payout.hostId}</div>
                        )}
                      </div>
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
                      {formatDate(payout.completedAt || payout.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(payout.amount || payout.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                        {payout.daysSinceCompleted !== undefined
                          ? `${payout.daysSinceCompleted} ngày`
                          : "Đang tính"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      {payout.bankName && payout.accountNumber ? (
                        <div className="space-y-1">
                          <div><span className="font-semibold">NH:</span> {payout.bankName}</div>
                          <div><span className="font-semibold">STK:</span> {payout.accountNumber}</div>
                          {payout.accountHolderName && (
                            <div><span className="font-semibold">Tên:</span> {payout.accountHolderName}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">Chưa có thông tin</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <ButtonPrimary
                        onClick={() => handleProcessPayout(payout.bookingId)}
                        disabled={processing}
                        className="min-w-[120px]"
                      >
                        {processing ? "Đang xử lý..." : "Xử lý"}
                      </ButtonPrimary>
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
              Thông tin về xử lý thanh toán
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Chỉ booking có status "Completed" mới được thanh toán</li>
                <li>Booking phải đủ 15 ngày kể từ ngày kết thúc (EndDate)</li>
                <li>Booking không có refund request đang pending/approved mới được thanh toán</li>
                <li>Khi xử lý, hệ thống sẽ đánh dấu IsPaidToHost = true và lưu thời gian thanh toán</li>
                <li>Có thể xử lý từng booking hoặc xử lý tất cả cùng lúc</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageAdminPayoutBooking;

