import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { packageAPI, HostPackageDetailsDto } from "api/package";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";

const HostPackageContent: React.FC = () => {
  const { user, isAuthenticated, hostPackage, reloadUser } = useAuth();
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
    loadPackage();
  }, [isAuthenticated, user, navigate, hostPackage]);

  const loadPackage = async () => {
    setLoading(true);
    setError("");
    try {
      const pkg = await packageAPI.getMyPackage();
      setCurrentPackage(pkg);
    } catch (err: any) {
      console.error("Failed to load package:", err);
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

  // API hủy package đã bị vô hiệu hóa ở backend
  // Host không thể hủy package, chỉ có thể nâng cấp bằng cách mua gói mới

  const formatCurrency = (amount: number | undefined) => {
    if (!amount && amount !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
        label: "Đang chờ",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      },
      Cancelled: {
        label: "Đã hủy",
        className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      },
      Expired: {
        label: "Hết hạn",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
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

  if (loading) {
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
          <h2 className="text-2xl font-bold">Gói đăng ký của tôi</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Quản lý gói đăng ký Host của bạn
          </p>
        </div>
        {!currentPackage && (
          <ButtonPrimary onClick={() => navigate("/pricing")}>
            Đăng ký gói mới
          </ButtonPrimary>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
          {success}
        </div>
      )}

      {!currentPackage ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Bạn chưa có gói đăng ký nào
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Đăng ký gói để bắt đầu đăng căn hộ và quản lý doanh thu.
          </p>
          <div className="mt-6">
            <ButtonPrimary onClick={() => navigate("/pricing")}>
              Xem các gói đăng ký
            </ButtonPrimary>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
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
            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Ngày bắt đầu
              </p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDate(currentPackage.startDate)}
              </p>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Ngày kết thúc
              </p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDate(currentPackage.endDate)}
              </p>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Số căn hộ đã đăng
              </p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {currentPackage.currentListings} / {currentPackage.maxListings}
              </p>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Tin nổi bật
              </p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {currentPackage.canUseFeaturedListing ? (
                  <span className="text-green-600 dark:text-green-400">✓ Có</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">✗ Không</span>
                )}
              </p>
            </div>
          </div>

          {currentPackage.status === "Active" && (
            <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
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
              </div>
              <div className="flex items-center justify-end">
                <ButtonPrimary
                  onClick={() => navigate("/pricing")}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  Nâng cấp gói
                </ButtonPrimary>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HostPackageContent;

