import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import voucherAPI, { VoucherDTO, VoucherCreateDTO, HostVoucherSettingDTO } from "api/voucher";
import condotelAPI, { CondotelDTO } from "api/condotel";
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
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<HostVoucherSettingDTO | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    // Load data when component mounts
    // Authentication is already checked by HostCondotelDashboard
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("🔄 Loading vouchers...");
      const vouchersData = await voucherAPI.getAll();
      console.log("✅ Vouchers loaded:", vouchersData);
      console.log("✅ Vouchers count:", vouchersData.length);
      setVouchers(vouchersData);
    } catch (err: any) {
      console.error("❌ Failed to load vouchers:", err);
      console.error("❌ Error response:", err.response?.data);
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

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const settingsData = await voucherAPI.getSettings();
      setSettings(settingsData);
    } catch (err: any) {
      console.error("Failed to load voucher settings:", err);
      // If settings don't exist yet, set default values
      setSettings({
        autoGenerateVouchers: false,
        defaultDiscountPercentage: undefined,
        defaultDiscountAmount: undefined,
        defaultUsageLimit: undefined,
        defaultMinimumOrderAmount: undefined,
        voucherPrefix: "",
        voucherLength: 8,
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (settingsData: HostVoucherSettingDTO) => {
    setSavingSettings(true);
    try {
      const savedSettings = await voucherAPI.saveSettings(settingsData);
      setSettings(savedSettings);
      setShowSettings(false);
      alert("Lưu cài đặt thành công!");
    } catch (err: any) {
      console.error("Failed to save voucher settings:", err);
      alert(err.response?.data?.message || "Không thể lưu cài đặt. Vui lòng thử lại!");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Danh sách voucher
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý các mã giảm giá cho khách hàng của bạn
          </p>
        </div>
        <div className="flex gap-3">
          <ButtonSecondary 
            onClick={() => {
              setShowSettings(true);
              if (!settings) {
                loadSettings();
              }
            }}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cài đặt
            </span>
          </ButtonSecondary>
          <ButtonPrimary 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm voucher
            </span>
          </ButtonPrimary>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 dark:border-purple-800"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-purple-50/30 dark:from-neutral-800 dark:to-purple-900/10 rounded-2xl shadow-xl border border-purple-200/50 dark:border-purple-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có voucher nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Bắt đầu bằng cách tạo voucher mới cho khách hàng của bạn.
          </p>
          <ButtonPrimary 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm voucher đầu tiên
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((voucher) => (
            <div
              key={voucher.voucherId}
              className="bg-gradient-to-br from-white to-purple-50/30 dark:from-neutral-800 dark:to-purple-900/10 rounded-2xl shadow-xl p-6 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1 font-mono bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {voucher.code}
                  </h3>
                  {voucher.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {voucher.description}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md ${
                    voucher.isActive
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
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

              <div className="flex items-center space-x-2 pt-4 border-t border-purple-200 dark:border-purple-800">
                <ButtonSecondary
                  onClick={() => setEditingVoucher(voucher)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </span>
                </ButtonSecondary>
                <button
                  onClick={() => handleDelete(voucher.voucherId, voucher.code)}
                  disabled={deletingId === voucher.voucherId}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingId === voucher.voucherId ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </>
                  )}
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
          console.error("Failed to load condotels:", err);
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
    // Bắt buộc chọn condotel khi tạo voucher mới
    if (!voucher && (!formData.condotelId || formData.condotelId <= 0)) {
      setError("Vui lòng chọn condotel để áp dụng voucher!");
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
        // Bắt buộc có condotelId khi tạo mới, giữ nguyên khi update
        condotelId: formData.condotelId && formData.condotelId > 0 ? formData.condotelId : (voucher ? (voucher as any).condotelId : undefined),
      };
      
      // Validate condotelId bắt buộc khi tạo mới
      if (!voucher && (!voucherData.condotelId || voucherData.condotelId <= 0)) {
        setError("Vui lòng chọn condotel để áp dụng voucher!");
        setLoading(false);
        return;
      }

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
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ position: 'fixed', width: '100%', height: '100%' }}>
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {voucher ? "Sửa Voucher" : "Thêm Voucher mới"}
            </h3>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-6">

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

              {/* Dropdown chọn Condotel - chỉ hiển thị khi tạo mới, bắt buộc */}
              {!voucher && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Áp dụng cho Condotel <span className="text-red-500">*</span>
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
                      required
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="">-- Chọn Condotel (Bắt buộc) --</option>
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
    autoGenerateVouchers: false,
    defaultDiscountPercentage: undefined,
    defaultDiscountAmount: undefined,
    defaultUsageLimit: undefined,
    defaultMinimumOrderAmount: undefined,
    voucherPrefix: "",
    voucherLength: 8,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style={{ position: 'fixed', width: '100%', height: '100%' }}>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ position: 'fixed', width: '100%', height: '100%' }}>
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cài đặt Voucher
            </h3>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Auto Generate Vouchers */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoGenerateVouchers || false}
                onChange={(e) =>
                  setFormData({ ...formData, autoGenerateVouchers: e.target.checked })
                }
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Tự động tạo voucher
              </span>
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 ml-8">
              Tự động tạo voucher mới khi có điều kiện
            </p>
          </div>

          {/* Default Discount Percentage */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Giảm giá mặc định (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.defaultDiscountPercentage || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultDiscountPercentage: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Nhập % giảm giá mặc định"
            />
          </div>

          {/* Default Discount Amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Giảm giá mặc định (VND)
            </label>
            <input
              type="number"
              min="0"
              value={formData.defaultDiscountAmount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Nhập số tiền giảm giá mặc định"
            />
          </div>

          {/* Default Usage Limit */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Giới hạn sử dụng mặc định
            </label>
            <input
              type="number"
              min="1"
              value={formData.defaultUsageLimit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultUsageLimit: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Nhập số lần sử dụng tối đa"
            />
          </div>

          {/* Default Minimum Order Amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Đơn hàng tối thiểu mặc định (VND)
            </label>
            <input
              type="number"
              min="0"
              value={formData.defaultMinimumOrderAmount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultMinimumOrderAmount: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Nhập giá trị đơn hàng tối thiểu"
            />
          </div>

          {/* Voucher Prefix */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Tiền tố mã voucher
            </label>
            <input
              type="text"
              value={formData.voucherPrefix || ""}
              onChange={(e) =>
                setFormData({ ...formData, voucherPrefix: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="VD: SALE, PROMO, etc."
            />
          </div>

          {/* Voucher Length */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Độ dài mã voucher
            </label>
            <input
              type="number"
              min="4"
              max="20"
              value={formData.voucherLength || 8}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  voucherLength: e.target.value ? Number(e.target.value) : 8,
                })
              }
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
            />
          </div>

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
    </div>
  );
};

export default HostVoucherContent;






