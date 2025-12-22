import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import voucherAPI, { VoucherDTO, VoucherCreateDTO, HostVoucherSettingDTO } from "api/voucher";
import condotelAPI, { CondotelDTO } from "api/condotel";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { toastSuccess, toastError, toastWarning, toastInfo } from "utils/toast";
import ConfirmModal from "components/ConfirmModal";

const HostVoucherContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);
  const [allVouchers, setAllVouchers] = useState<VoucherDTO[]>([]); // Store all vouchers for client-side pagination
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherDTO | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<HostVoucherSettingDTO | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingVoucherId, setDeletingVoucherId] = useState<number | null>(null);
  const [deletingVoucherCode, setDeletingVoucherCode] = useState<string>("");

  useEffect(() => {
    // Check if user is Host
    if (!isAuthenticated || user?.roleName !== "Host") {
      navigate("/");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await voucherAPI.getAll({
        pageNumber: currentPage,
        pageSize: pageSize,
      });
      
      // Handle both paginated and non-paginated responses
      if (result && typeof result === 'object' && 'data' in result) {
        // Paginated response: { data: [...], pagination: {...} }
        const vouchersData = Array.isArray(result.data) ? result.data : [];
        
        if (result.pagination) {
          // Server-side pagination
          const pag = result.pagination;
          const totalPagesValue = pag.totalPages || pag.TotalPages || Math.ceil((pag.totalCount || pag.TotalCount || vouchersData.length) / pageSize);
          const totalCountValue = pag.totalCount || pag.TotalCount || vouchersData.length;
          
          setVouchers(vouchersData);
          setTotalPages(totalPagesValue);
          setTotalCount(totalCountValue);
          setAllVouchers([]); // Clear client-side cache
        } else {
          // No pagination info, treat as all data - use client-side pagination
          setAllVouchers(vouchersData);
          
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = vouchersData.slice(startIndex, endIndex);
          
          setVouchers(paginatedData);
          setTotalPages(Math.ceil(vouchersData.length / pageSize));
          setTotalCount(vouchersData.length);
        }
      } else if (Array.isArray(result)) {
        // Legacy format: just array - client-side pagination
        setAllVouchers(result);
        
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = result.slice(startIndex, endIndex);
        
        setVouchers(paginatedData);
        setTotalPages(Math.ceil(result.length / pageSize));
        setTotalCount(result.length);
      } else {
        // Fallback
        setVouchers([]);
        setAllVouchers([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tải danh sách voucher";
      setError(errorMsg);
      toastError(errorMsg);
      setVouchers([]);
      setAllVouchers([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  // Refetch vouchers when page changes (only if server-side pagination)
  // If client-side pagination, just slice the array
  useEffect(() => {
    // Check if user is Host before loading
    if (!isAuthenticated || user?.roleName !== "Host") {
      return;
    }

    if (allVouchers.length > 0) {
      // Client-side pagination - just slice the array
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = allVouchers.slice(startIndex, endIndex);
      setVouchers(paginatedData);
    } else {
      // Server-side pagination - fetch from API
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isAuthenticated, user]);
  
  // Reset to page 1 when filters change (if any filters are added later)
  useEffect(() => {
    setCurrentPage(1);
    setAllVouchers([]); // Clear client-side cache when filters change
  }, []); // Add filter dependencies here if filters are added later

  const handleDelete = async (voucherId: number, code: string) => {
    setDeletingVoucherId(voucherId);
    setDeletingVoucherCode(code);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingVoucherId) return;
    setShowConfirmModal(false);
    setDeletingId(deletingVoucherId);
    try {
      await voucherAPI.delete(deletingVoucherId);
      // Reset to page 1 and reload
      setCurrentPage(1);
      setAllVouchers([]); // Clear client-side cache
      await loadData();
      toastSuccess("Xóa voucher thành công!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể xóa voucher";
      toastError(errorMsg);
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

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const settingsData = await voucherAPI.getSettings();
      setSettings(settingsData); // Có thể là null nếu chưa có setting
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tải cài đặt";
      setError(errorMsg);
      toastError(errorMsg);
      setSettings(null);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (newSettings: HostVoucherSettingDTO) => {
    setSavingSettings(true);
    try {
      const savedSettings = await voucherAPI.saveSettings(newSettings);
      setSettings(savedSettings);
      setShowSettings(false);
      toastSuccess("Cập nhật cài đặt thành công!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể lưu cài đặt";
      toastError(errorMsg);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Danh sách voucher</h2>
        <div className="flex gap-3">
          <ButtonSecondary onClick={() => {
            setShowSettings(true);
            if (!settings) {
              loadSettings();
            }
          }}>
            ⚙️ Cài đặt
          </ButtonSecondary>
        </div>
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20 dark:border-neutral-700/50">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} voucher
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                  : "text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg"
              }`}
            >
              Đầu
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                  : "text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg"
              }`}
            >
              Trước
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                      currentPage === page
                        ? "text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg scale-105"
                        : "text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-600 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2 text-gray-400">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                  : "text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg"
              }`}
            >
              Sau
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                  : "text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg"
              }`}
            >
              Cuối
            </button>
          </div>
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

      {/* Settings Modal */}
      {showSettings && (
        <VoucherSettingsModal
          settings={settings}
          loading={loadingSettings}
          saving={savingSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
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
    condotelId: (voucher as any)?.condotelId || undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loadingCondotels, setLoadingCondotels] = useState(false);

  // Fetch condotels của host khi mở modal (chỉ khi tạo mới)
  useEffect(() => {
    if (!voucher) {
      // Chỉ fetch khi tạo mới, không fetch khi edit
      const fetchCondotels = async () => {
        setLoadingCondotels(true);
        try {
          const data = await condotelAPI.getAllForHost();
          setCondotels(data);
        } catch (err: any) {
          // Không set error vì condotelId là optional
        } finally {
          setLoadingCondotels(false);
        }
      };
      fetchCondotels();
    }
  }, [voucher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation theo spec API
    if (!formData.code || !formData.code.trim()) {
      setError("Vui lòng nhập mã voucher!");
      toastWarning("Mã voucher là bắt buộc");
      return;
    }
    // CondotelID là bắt buộc theo spec khi tạo voucher thủ công
    if (!voucher && !formData.condotelId) {
      setError("Vui lòng chọn condotel!");
      toastWarning("Condotel là bắt buộc khi tạo voucher");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError("Vui lòng chọn ngày bắt đầu và kết thúc!");
      toastWarning("Ngày bắt đầu và kết thúc là bắt buộc");
      return;
    }
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    if (startDate >= endDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu!");
      toastWarning("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    
    // Kiểm tra endDate không được ở quá khứ
    if (endDate < today) {
      setError("Ngày kết thúc không được ở quá khứ!");
      toastWarning("Ngày kết thúc không được ở quá khứ");
      return;
    }
    
    // Kiểm tra startDate không được ở quá khứ (nếu đang tạo mới)
    if (!voucher && startDate < today) {
      setError("Ngày bắt đầu không được ở quá khứ!");
      toastWarning("Ngày bắt đầu không được ở quá khứ");
      return;
    }
    // Ít nhất một trong: DiscountAmount hoặc DiscountPercentage (theo spec)
    if (!formData.discountPercentage && !formData.discountAmount) {
      setError("Vui lòng nhập phần trăm giảm giá hoặc số tiền giảm giá!");
      toastWarning("Vui lòng nhập ít nhất một trong: phần trăm giảm giá hoặc số tiền giảm giá");
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
        condotelId: formData.condotelId || undefined,
      };

      if (voucher) {
        // Update voucher
        await voucherAPI.update(voucher.voucherId, voucherData);
        toastSuccess("✅ Cập nhật voucher thành công!");
      } else {
        // Create voucher
        await voucherAPI.create(voucherData);
        toastSuccess("✅ Tạo voucher thành công!");
      }
      // Delay slightly to show success message before closing
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      let errorMessage = "❌ Không thể lưu voucher. Vui lòng thử lại!";

      if (err.response?.data?.message) {
        errorMessage = `❌ ${err.response.data.message}`;
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorList = Object.entries(errors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
            const messageList = Array.isArray(messages) ? messages.join(", ") : messages;
            return `${fieldName}: ${messageList}`;
          })
          .join("\n");
        errorMessage = `❌ Lỗi validation:\n${errorList}`;
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }
      setError(errorMessage);
      toastError(errorMessage);
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

              {/* Dropdown chọn Condotel - chỉ hiển thị khi tạo mới */}
              {!voucher && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Áp dụng cho Condotel (Tùy chọn)
                  </label>
                  {loadingCondotels ? (
                    <div className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700">
                      <span className="text-sm text-neutral-500">Đang tải danh sách condotel...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.condotelId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          condotelId: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="">-- Chọn Condotel (Để trống nếu áp dụng cho tất cả) --</option>
                      {condotels.map((condotel) => (
                        <option key={condotel.condotelId} value={condotel.condotelId}>
                          {condotel.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {condotels.length === 0 && !loadingCondotels && (
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Bạn chưa có condotel nào. Voucher sẽ áp dụng cho tất cả condotel.
                    </p>
                  )}
                </div>
              )}

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

// Voucher Settings Modal Component
interface VoucherSettingsModalProps {
  settings: HostVoucherSettingDTO | null;
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (settings: HostVoucherSettingDTO) => void;
}

const VoucherSettingsModal: React.FC<VoucherSettingsModalProps> = ({
  settings,
  loading,
  saving,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<HostVoucherSettingDTO>({
    autoGenerate: false,
    discountPercentage: undefined,
    discountAmount: undefined,
    validMonths: 3, // Mặc định 3 tháng theo spec
    usageLimit: undefined,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (settings) {
      // Map từ settings cũ sang format mới
      setFormData({
        autoGenerate: settings.autoGenerate !== undefined ? settings.autoGenerate : (settings.autoGenerateVouchers || false),
        discountPercentage: settings.discountPercentage !== undefined ? settings.discountPercentage : settings.defaultDiscountPercentage,
        discountAmount: settings.discountAmount !== undefined ? settings.discountAmount : settings.defaultDiscountAmount,
        validMonths: settings.validMonths || 3,
        usageLimit: settings.usageLimit !== undefined ? settings.usageLimit : settings.defaultUsageLimit,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation theo spec
    // Phải có ít nhất một trong hai: DiscountAmount HOẶC DiscountPercentage
    if (!formData.discountAmount && !formData.discountPercentage) {
      setError("Vui lòng nhập ít nhất một trong hai: Giảm giá theo số tiền HOẶC Giảm giá theo %");
      return;
    }
    
    // Validation discountAmount: 0 - 100,000,000
    if (formData.discountAmount !== undefined && (formData.discountAmount < 0 || formData.discountAmount > 100000000)) {
      setError("Giảm giá theo số tiền phải từ 0 đến 100,000,000 VNĐ");
      return;
    }
    
    // Validation discountPercentage: 0 - 100
    if (formData.discountPercentage !== undefined && (formData.discountPercentage < 0 || formData.discountPercentage > 100)) {
      setError("Giảm giá theo % phải từ 0 đến 100%");
      return;
    }
    
    // Validation validMonths: 1 - 24
    if (!formData.validMonths || formData.validMonths < 1 || formData.validMonths > 24) {
      setError("Thời hạn voucher phải từ 1 đến 24 tháng");
      return;
    }
    
    // Validation usageLimit: 1 - 1000 (nếu có)
    if (formData.usageLimit !== undefined && (formData.usageLimit < 1 || formData.usageLimit > 1000)) {
      setError("Giới hạn sử dụng phải từ 1 đến 1000 lần");
      return;
    }
    
    onSave(formData);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Cài đặt Voucher
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
          }} className="space-y-6">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoGenerate || false}
                onChange={(e) =>
                  setFormData({ ...formData, autoGenerate: e.target.checked })
                }
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                required
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Tự động tạo voucher <span className="text-red-500">*</span>
              </span>
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 ml-8">
              Tự động tạo voucher khi booking chuyển sang Status = "Completed"
            </p>
          </div>

          {/* Discount Percentage - Optional (0-100%) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Giảm giá theo % (Tùy chọn)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discountPercentage !== undefined ? formData.discountPercentage : ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountPercentage: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Nhập % giảm giá (0-100)"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Phải có ít nhất một trong hai: Giảm giá theo % HOẶC Giảm giá theo số tiền
            </p>
          </div>

          {/* Discount Amount - Optional (0-100,000,000) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Giảm giá theo số tiền (VNĐ) (Tùy chọn)
            </label>
            <input
              type="number"
              min="0"
              max="100000000"
              step="1000"
              value={formData.discountAmount !== undefined ? formData.discountAmount : ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountAmount: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Nhập số tiền giảm giá (0-100,000,000)"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Phải có ít nhất một trong hai: Giảm giá theo % HOẶC Giảm giá theo số tiền
            </p>
          </div>

          {/* Valid Months - BẮT BUỘC (1-24 tháng) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Thời hạn voucher (tháng) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={formData.validMonths || 3}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  validMonths: e.target.value ? Number(e.target.value) : 3,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Nhập số tháng (1-24)"
              required
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Voucher sẽ có thời hạn bằng số tháng này khi tự động tạo (1-24 tháng)
            </p>
          </div>

          {/* Usage Limit - Optional (1-1000) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Giới hạn sử dụng (Tùy chọn)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.usageLimit !== undefined ? formData.usageLimit : ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  usageLimit: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Nhập số lần sử dụng tối đa (1-1000)"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Số lần sử dụng tối đa cho mỗi voucher (1-1000)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <ButtonSecondary onClick={onClose} disabled={saving}>
              Hủy
            </ButtonSecondary>
            <ButtonPrimary type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </ButtonPrimary>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HostVoucherContent;






