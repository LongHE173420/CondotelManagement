import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import voucherAPI, { VoucherDTO, VoucherCreateDTO } from "api/voucher";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";

const HostVoucherContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherDTO | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is Host
    if (!isAuthenticated || user?.roleName !== "Host") {
      navigate("/");
      return;
    }
    loadData();
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const vouchersData = await voucherAPI.getAll();
      setVouchers(vouchersData);
    } catch (err: any) {
      console.error("Failed to load vouchers:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách voucher");
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (voucherId: number, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa voucher "${code}"?`)) {
      return;
    }

    setDeletingId(voucherId);
    try {
      await voucherAPI.delete(voucherId);
      await loadData();
      alert("Xóa voucher thành công!");
    } catch (err: any) {
      console.error("Failed to delete voucher:", err);
      alert(err.response?.data?.message || "Không thể xóa voucher");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Danh sách voucher</h2>
        <ButtonPrimary onClick={() => setShowAddModal(true)}>
          + Thêm voucher
        </ButtonPrimary>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          {error}
          <button
            onClick={loadData}
            className="ml-4 text-red-600 underline hover:text-red-800"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : vouchers.length === 0 ? (
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Chưa có voucher nào
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Bắt đầu bằng cách tạo voucher mới cho khách hàng của bạn.
          </p>
          <div className="mt-6">
            <ButtonPrimary onClick={() => setShowAddModal(true)}>
              + Thêm voucher đầu tiên
            </ButtonPrimary>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((voucher) => (
            <div
              key={voucher.voucherId}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {voucher.code}
                  </h3>
                  {voucher.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {voucher.description}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    voucher.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {voucher.isActive ? "Đang hoạt động" : "Đã tắt"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {voucher.discountPercentage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      Giảm giá:
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {voucher.discountPercentage}%
                    </span>
                  </div>
                )}
                {voucher.discountAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      Giảm giá:
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(voucher.discountAmount)}
                    </span>
                  </div>
                )}
                {voucher.minimumOrderAmount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Đơn tối thiểu:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(voucher.minimumOrderAmount)}
                    </span>
                  </div>
                )}
                {voucher.usageLimit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Giới hạn sử dụng:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {voucher.usedCount || 0} / {voucher.usageLimit}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Từ:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {formatDate(voucher.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Đến:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {formatDate(voucher.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <ButtonSecondary
                  onClick={() => setEditingVoucher(voucher)}
                  className="flex-1"
                >
                  Sửa
                </ButtonSecondary>
                <button
                  onClick={() => handleDelete(voucher.voucherId, voucher.code)}
                  disabled={deletingId === voucher.voucherId}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {deletingId === voucher.voucherId ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingVoucher) && (
        <VoucherModal
          voucher={editingVoucher}
          onClose={() => {
            setShowAddModal(false);
            setEditingVoucher(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingVoucher(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Voucher Modal Component
interface VoucherModalProps {
  voucher?: VoucherDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const VoucherModal: React.FC<VoucherModalProps> = ({
  voucher,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    code: voucher?.code || "",
    description: voucher?.description || "",
    discountPercentage: voucher?.discountPercentage || undefined,
    discountAmount: voucher?.discountAmount || undefined,
    startDate: voucher?.startDate
      ? new Date(voucher.startDate).toISOString().split("T")[0]
      : "",
    endDate: voucher?.endDate
      ? new Date(voucher.endDate).toISOString().split("T")[0]
      : "",
    isActive: voucher?.isActive !== undefined ? voucher.isActive : true,
    usageLimit: voucher?.usageLimit || undefined,
    minimumOrderAmount: voucher?.minimumOrderAmount || undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.code || !formData.code.trim()) {
      setError("Vui lòng nhập mã voucher!");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError("Vui lòng chọn ngày bắt đầu và kết thúc!");
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError("Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }
    if (!formData.discountPercentage && !formData.discountAmount) {
      setError("Vui lòng nhập phần trăm giảm giá hoặc số tiền giảm giá!");
      return;
    }

    setLoading(true);
    try {
      const voucherData: VoucherCreateDTO = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description?.trim() || undefined,
        discountPercentage: formData.discountPercentage,
        discountAmount: formData.discountAmount,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
        usageLimit: formData.usageLimit,
        minimumOrderAmount: formData.minimumOrderAmount,
      };

      if (voucher) {
        // Update voucher
        await voucherAPI.update(voucher.voucherId, voucherData);
        alert("Cập nhật voucher thành công!");
      } else {
        // Create voucher
        await voucherAPI.create(voucherData);
        alert("Tạo voucher thành công!");
      }
      onSuccess();
    } catch (err: any) {
      console.error("Failed to save voucher:", err);
      let errorMessage = "Không thể lưu voucher. Vui lòng thử lại!";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorList = Object.entries(errors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
            const messageList = Array.isArray(messages) ? messages.join(", ") : messages;
            return `${fieldName}: ${messageList}`;
          })
          .join("\n");
        errorMessage = `Lỗi validation:\n${errorList}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {voucher ? "Sửa Voucher" : "Thêm Voucher mới"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Mã voucher *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().replace(/\s/g, ""),
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                  placeholder="VD: GIAM50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="Mô tả về voucher..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountPercentage: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                        discountAmount: undefined, // Clear discountAmount if percentage is set
                      }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Giảm giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discountAmount || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountAmount: e.target.value ? Number(e.target.value) : undefined,
                        discountPercentage: undefined, // Clear percentage if amount is set
                      }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Đơn hàng tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimumOrderAmount || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minimumOrderAmount: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Giới hạn sử dụng
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usageLimit || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      usageLimit: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="Không giới hạn"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Kích hoạt ngay
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <ButtonSecondary onClick={onClose}>Hủy</ButtonSecondary>
                <ButtonPrimary type="submit" disabled={loading}>
                  {loading ? "Đang lưu..." : voucher ? "Cập nhật" : "Tạo mới"}
                </ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostVoucherContent;

