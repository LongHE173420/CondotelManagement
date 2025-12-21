import React, { useState, useEffect } from "react";
import { useAuth } from "contexts/AuthContext";
import voucherAPI, { VoucherDTO } from "api/voucher";
import CommonLayout from "./CommonLayout";

const AccountVouchers: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      loadVouchers();
    } else {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem mã giảm giá");
    }
  }, [isAuthenticated, user]);

  const loadVouchers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await voucherAPI.getAvailableForTenant();
      // Filter only active vouchers
      const activeVouchers = data.filter(
        (v) => v.isActive && new Date(v.endDate) >= new Date()
      );
      setVouchers(activeVouchers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách mã giảm giá");
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Đã copy mã: ${code}`);
  };

  if (loading) {
    return (
      <CommonLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold">Mã giảm giá của tôi</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Xem và sử dụng các mã giảm giá có sẵn
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
            <p className="font-medium">Lỗi: {error}</p>
            <button
              onClick={loadVouchers}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:text-red-800"
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && vouchers.length === 0 && !error && (
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
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Chưa có mã giảm giá nào
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Hiện tại bạn chưa có mã giảm giá nào có thể sử dụng.
            </p>
          </div>
        )}

        {vouchers.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vouchers.map((voucher) => (
              <div
                key={voucher.voucherId}
                className="relative border-2 border-dashed border-primary-500 rounded-xl p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {voucher.discountPercentage
                          ? `${voucher.discountPercentage}%`
                          : voucher.discountAmount
                          ? `${voucher.discountAmount.toLocaleString("vi-VN")} đ`
                          : "Giảm giá"}
                      </span>
                    </div>
                    <div className="mb-3">
                      <span className="px-3 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-lg inline-block">
                        {voucher.code}
                      </span>
                    </div>
                    {voucher.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        {voucher.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  {voucher.minimumOrderAmount && (
                    <p>
                      Áp dụng cho đơn từ{" "}
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {formatCurrency(voucher.minimumOrderAmount)}
                      </span>
                    </p>
                  )}
                  <p>
                    HSD:{" "}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {formatDate(voucher.endDate)}
                    </span>
                  </p>
                  {voucher.usageLimit && voucher.usedCount !== undefined && (
                    <p>
                      Đã dùng:{" "}
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {voucher.usedCount}/{voucher.usageLimit}
                      </span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => copyToClipboard(voucher.code)}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Copy mã
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </CommonLayout>
  );
};

export default AccountVouchers;






