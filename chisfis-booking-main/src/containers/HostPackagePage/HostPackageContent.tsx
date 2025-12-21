import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { packageAPI, HostPackageDetailsDto } from "api/package";
import ButtonPrimary from "shared/Button/ButtonPrimary";

const HostPackageContent: React.FC = () => {
  const { user, isAuthenticated, hostPackage } = useAuth();
  const navigate = useNavigate();
  const [currentPackage, setCurrentPackage] = useState<HostPackageDetailsDto | null>(hostPackage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Check if user is Host
    if (!isAuthenticated || user?.roleName !== "Host") {
      navigate("/");
      return;
    }

    // Kiểm tra thêm: nếu có package nhưng trạng thái không active
    if (hostPackage) {
      const invalidStatus = ["Inactive", "PendingPayment", "Cancelled", "Expired"];
      if (invalidStatus.includes(hostPackage.status)) {
      }
    }

    loadPackage();
  }, [isAuthenticated, user, navigate, hostPackage]);

  const loadPackage = async () => {
    setLoading(true);
    setError("");
    try {
      const pkg = await packageAPI.getMyPackage();
      setCurrentPackage(pkg);
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        // Host chưa có package → bình thường
        setCurrentPackage(null);
      } else {
        setError(err.response?.data?.message || "Không thể tải thông tin gói đăng ký");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00"));
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      Active: {
        label: "Đang hoạt động",
        className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      },
      Pending: {
        label: "Đang chờ xử lý",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      },
      PendingPayment: {
        label: "Đang chờ thanh toán",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      },
      Inactive: {
        label: "Chưa kích hoạt",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      },
      Cancelled: {
        label: "Đã hủy",
        className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      },
      Expired: {
        label: "Hết hạn",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleRetryPayment = () => {
    // Luôn chuyển đến trang pricing khi nhấn "Tiếp tục thanh toán"
    navigate("/pricing");
  };

  const handleUpgradePackage = () => {
    navigate("/pricing");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Gói đăng ký của tôi
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý gói đăng ký Host của bạn
          </p>
        </div>
        {(!currentPackage ||
          currentPackage.status === "Inactive" ||
          currentPackage.status === "PendingPayment" ||
          currentPackage.status === "Expired" ||
          currentPackage.status === "Cancelled") && (
            <ButtonPrimary
              onClick={() => navigate("/pricing")}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Đăng ký gói mới
              </span>
            </ButtonPrimary>
          )}
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

      {success && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 text-green-800 dark:text-green-200 rounded-xl shadow-lg backdrop-blur-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        </div>
      )}

      {!currentPackage ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-indigo-50/30 dark:from-neutral-800 dark:to-indigo-900/10 rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Bạn chưa có gói đăng ký nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Đăng ký gói để bắt đầu đăng căn hộ và quản lý doanh thu.
          </p>
          <ButtonPrimary
            onClick={() => navigate("/pricing")}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Xem các gói đăng ký
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-neutral-800 dark:to-indigo-900/10 rounded-2xl shadow-xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {currentPackage.packageName}
                </h3>
                {getStatusBadge(currentPackage.status)}
              </div>
              {currentPackage.message && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  {currentPackage.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800 shadow-md">
              <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">
                Ngày bắt đầu
              </p>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {formatDate(currentPackage.startDate)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800 shadow-md">
              <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">
                Ngày kết thúc
              </p>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {formatDate(currentPackage.endDate)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800 shadow-md">
              <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">
                Số căn hộ đã đăng
              </p>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {currentPackage.currentListings} / {currentPackage.maxListings}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800 shadow-md">
              <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">
                Tin nổi bật
              </p>
              <p className="text-xl font-bold">
                {currentPackage.canUseFeaturedListing ? (
                  <span className="text-green-600 dark:text-green-400">✓ Có</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">✗ Không</span>
                )}
              </p>
            </div>
          </div>

          {/* Hiển thị thông báo và nút hành động theo trạng thái */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
            {currentPackage.status === "Inactive" || currentPackage.status === "PendingPayment" ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                      {currentPackage.status === "PendingPayment"
                        ? "Đang chờ thanh toán"
                        : "Gói chưa được kích hoạt"}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {currentPackage.status === "PendingPayment"
                        ? "Bạn đã tạo đơn hàng nhưng chưa hoàn tất thanh toán. Vui lòng thanh toán để kích hoạt gói."
                        : "Bạn đã chọn gói này nhưng chưa hoàn tất thanh toán. Vui lòng thanh toán để kích hoạt gói."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <ButtonPrimary
                    onClick={handleRetryPayment}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {currentPackage.status === "PendingPayment"
                        ? "Tiếp tục thanh toán"
                        : "Thanh toán ngay"}
                    </span>
                  </ButtonPrimary>
                </div>
              </div>
            ) : currentPackage.status === "Active" ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Nâng cấp gói của bạn
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Bạn không thể hủy gói hiện tại. Để có thêm quyền lợi, bạn có thể nâng cấp lên gói cao hơn.
                      Gói cũ sẽ tự động được thay thế khi bạn thanh toán gói mới thành công.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <ButtonPrimary
                    onClick={handleUpgradePackage}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Nâng cấp gói
                    </span>
                  </ButtonPrimary>
                </div>
              </div>
            ) : currentPackage.status === "Pending" ? (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                      Đang chờ xác nhận thanh toán
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Gói của bạn đang chờ hệ thống xác nhận thanh toán.
                      Vui lòng chờ trong giây lát hoặc liên hệ hỗ trợ nếu quá lâu.
                    </p>
                  </div>
                </div>
              </div>
            ) : currentPackage.status === "Expired" ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                      Gói đã hết hạn
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Gói của bạn đã hết hạn. Vui lòng đăng ký gói mới để tiếp tục sử dụng dịch vụ.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <ButtonPrimary
                    onClick={() => navigate("/pricing")}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  >
                    Đăng ký gói mới
                  </ButtonPrimary>
                </div>
              </div>
            ) : currentPackage.status === "Cancelled" && (
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                      Gói đã bị hủy
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      Gói của bạn đã bị hủy. Vui lòng đăng ký gói mới để tiếp tục sử dụng dịch vụ.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <ButtonPrimary
                    onClick={() => navigate("/pricing")}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  >
                    Đăng ký gói mới
                  </ButtonPrimary>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HostPackageContent;