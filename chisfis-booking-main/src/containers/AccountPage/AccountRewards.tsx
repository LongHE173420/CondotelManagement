import React, { useState, useEffect } from "react";
import { useAuth } from "contexts/AuthContext";
import rewardAPI, {
  RewardPointsDTO,
  RewardHistoryItemDTO,
  RewardHistoryQueryDTO,
  RedeemPointsDTO,
  PromotionDTO,
} from "api/reward";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import Input from "shared/Input/Input";
import CommonLayout from "./CommonLayout";

const AccountRewards: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [points, setPoints] = useState<RewardPointsDTO | null>(null);
  const [history, setHistory] = useState<RewardHistoryItemDTO[]>([]);
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const [redeemPoints, setRedeemPoints] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [historyQuery, setHistoryQuery] = useState<RewardHistoryQueryDTO>({
    page: 1,
    pageSize: 10,
    type: "All",
  });
  const [historyPagination, setHistoryPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    page: 1,
    pageSize: 10,
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    } else {
      // Nếu chưa đăng nhập, vẫn hiển thị trang nhưng với message
      setLoading(false);
      setError("Vui lòng đăng nhập để xem điểm thưởng");
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [pointsData, promotionsData] = await Promise.all([
        rewardAPI.getMyPoints(),
        rewardAPI.getAvailablePromotions(),
      ]);
      setPoints(pointsData);
      setPromotions(promotionsData);
      await loadHistory();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Không thể tải thông tin điểm thưởng";
      setError(errorMessage);
      // Vẫn hiển thị trang ngay cả khi có lỗi
      // Set default values để UI không bị lỗi
      if (!points) {
        setPoints({
          userId: user?.userId || 0,
          totalPoints: 0,
          availablePoints: 0,
          usedPoints: 0,
        });
      }
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const historyData = await rewardAPI.getPointsHistory(historyQuery);
      setHistory(historyData.history);
      setHistoryPagination({
        totalCount: historyData.totalCount,
        totalPages: historyData.totalPages,
        page: historyData.page,
        pageSize: historyData.pageSize,
      });
    } catch (err: any) {
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadHistory();
    }
  }, [historyQuery]);

  const handleRedeem = async () => {
    const pointsToRedeem = parseInt(redeemPoints);
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      setError("Vui lòng nhập số điểm hợp lệ!");
      return;
    }

    // Validate trước
    try {
      const validation = await rewardAPI.validateRedeem(pointsToRedeem);
      if (!validation.isValid) {
        setError(validation.message);
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể validate điểm thưởng");
      return;
    }

    setRedeeming(true);
    setError("");
    try {
      const dto: RedeemPointsDTO = {
        pointsToRedeem: pointsToRedeem,
      };
      const result = await rewardAPI.redeemPoints(dto);
      if (result.success) {
        alert(result.message || "Đổi điểm thành công!");
        setShowRedeemModal(false);
        setRedeemPoints("");
        await loadData(); // Reload points và history
      } else {
        setError(result.message || "Không thể đổi điểm");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể đổi điểm. Vui lòng thử lại!");
    } finally {
      setRedeeming(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getHistoryTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "earned":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "redeemed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getHistoryTypeVN = (type: string) => {
    switch (type?.toLowerCase()) {
      case "earned":
        return "Tích điểm";
      case "redeemed":
        return "Đã dùng";
      case "expired":
        return "Hết hạn";
      default:
        return type;
    }
  };


  return (
    <CommonLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Điểm thưởng</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Quản lý điểm thưởng và đổi điểm lấy giảm giá
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
            <p className="font-medium">Lỗi: {error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:text-red-800"
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && (
          <>

      {/* Points Overview */}
      {points && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Tổng điểm
                </p>
                <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {(points.totalPoints || 0).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="bg-primary-100 dark:bg-primary-900/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Điểm khả dụng
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {(points.availablePoints || 0).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Đã sử dụng
                </p>
                <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {(points.usedPoints || 0).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Points Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Đổi điểm thưởng</h3>
          <ButtonPrimary onClick={() => setShowRedeemModal(true)}>
            Đổi điểm
          </ButtonPrimary>
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <p>• 1000 điểm = 1 VNĐ giảm giá</p>
          <p>• Điểm tối thiểu để đổi: 1000 điểm</p>
          {points && (
            <p className="mt-2">
              • Giá trị hiện tại: ~{" "}
              {formatCurrency((points.availablePoints || 0) / 1000)}
            </p>
          )}
        </div>
      </div>

      {/* Promotions */}
      {promotions.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Chương trình khuyến mãi</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {promotions.map((promo) => (
              <div
                key={promo.promotionId}
                className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {promo.title}
                  </h4>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      promo.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {promo.isActive ? "Đang hoạt động" : "Đã kết thúc"}
                  </span>
                </div>
                {promo.description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    {promo.description}
                  </p>
                )}
                {promo.pointsRequired && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Cần: {(promo.pointsRequired || 0).toLocaleString("vi-VN")} điểm
                  </p>
                )}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Lịch sử giao dịch</h3>
          <select
            value={historyQuery.type || "All"}
            onChange={(e) =>
              setHistoryQuery((prev) => ({ ...prev, type: e.target.value, page: 1 }))
            }
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
          >
            <option value="All">Tất cả</option>
            <option value="Earned">Tích điểm</option>
            <option value="Redeemed">Đã dùng</option>
            <option value="Expired">Hết hạn</option>
          </select>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            Chưa có giao dịch nào
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Điểm
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Ngày
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {history.map((item, index) => (
                    <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getHistoryTypeColor(
                            item.type
                          )}`}
                        >
                          {getHistoryTypeVN(item.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {item.points > 0 ? "+" : ""}
                        {(item.points || 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {item.description || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {historyPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Trang {historyPagination.page} / {historyPagination.totalPages} (
                  {historyPagination.totalCount} giao dịch)
                </div>
                <div className="flex space-x-2">
                  <ButtonSecondary
                    onClick={() =>
                      setHistoryQuery((prev) => ({
                        ...prev,
                        page: Math.max(1, (prev.page || 1) - 1),
                      }))
                    }
                    disabled={historyPagination.page <= 1}
                  >
                    Trước
                  </ButtonSecondary>
                  <ButtonSecondary
                    onClick={() =>
                      setHistoryQuery((prev) => ({
                        ...prev,
                        page: Math.min(
                          historyPagination.totalPages,
                          (prev.page || 1) + 1
                        ),
                      }))
                    }
                    disabled={historyPagination.page >= historyPagination.totalPages}
                  >
                    Sau
                  </ButtonSecondary>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowRedeemModal(false)}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  Đổi điểm thưởng
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Số điểm muốn đổi *
                    </label>
                    <Input
                      type="number"
                      min="1000"
                      value={redeemPoints}
                      onChange={(e) => {
                        setRedeemPoints(e.target.value);
                        setError("");
                      }}
                      placeholder="Nhập số điểm (tối thiểu 1000)"
                      className="w-full"
                    />
                    {redeemPoints && parseInt(redeemPoints) >= 1000 && (
                      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        Giảm giá: ~
                        {formatCurrency(parseInt(redeemPoints) / 1000)}
                      </p>
                    )}
                  </div>

                  {points && (
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Điểm khả dụng:{" "}
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {(points.availablePoints || 0).toLocaleString("vi-VN")} điểm
                        </span>
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <ButtonSecondary onClick={() => setShowRedeemModal(false)}>
                      Hủy
                    </ButtonSecondary>
                    <ButtonPrimary
                      onClick={handleRedeem}
                      disabled={redeeming || !redeemPoints || parseInt(redeemPoints) < 1000}
                    >
                      {redeeming ? "Đang xử lý..." : "Đổi điểm"}
                    </ButtonPrimary>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
          </>
        )}
      </div>
    </CommonLayout>
  );
};

export default AccountRewards;

