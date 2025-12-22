import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { condotelAPI, CondotelDTO, PromotionDTO } from "api/condotel";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { toast } from "react-toastify";
import { showSuccess, showError } from "utils/modalNotification";

// Helper function to translate backend error messages to Vietnamese
const translateErrorMessage = (message: string): string => {
  const translations: { [key: string]: string } = {
    "Promotion period overlaps": "Khoảng thời gian khuyến mãi bị trùng lặp với khuyến mãi khác",
    "overlaps": "bị trùng lặp",
    "with another promotion": "với khuyến mãi khác",
  };

  let translated = message;
  for (const [english, vietnamese] of Object.entries(translations)) {
    const regex = new RegExp(english, "gi");
    translated = translated.replace(regex, vietnamese);
  }
  return translated;
};

const HostPromotionContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionDTO | null>(null);
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
      // Load condotels first
      const condotelsData = await condotelAPI.getAllForHost();
      setCondotels(condotelsData);

      // Load all promotions (từ tất cả condotels của host)
      try {
        const promotionsData = await condotelAPI.getPromotions();
        // Gắn condotelName và chuẩn hóa trạng thái
        const promotionsWithNames = promotionsData.map((p: any) => {
          const active = p.isActive === true || (p as any).isActive === "true" || (p.status || "").toLowerCase() === "active";
          return {
            ...p,
            condotelName:
              p.condotelName ||
              condotelsData.find((c: any) => c.condotelId === p.condotelId)?.name ||
              `Condotel #${p.condotelId}`,
            isActive: active,
            status: active ? "Active" : "Inactive",
          };
        });
        setPromotions(promotionsWithNames);
      } catch (promoErr: any) {
        // Nếu endpoint getPromotions không có condotelId không work, 
        // thử lấy promotions từ từng condotel

        try {
          const allPromotions = await condotelAPI.getPromotions(); // ← Lấy hết luôn
          const promotionsWithNames = allPromotions.map((p: any) => {
            const active = p.isActive === true || (p as any).isActive === "true" || (p.status || "").toLowerCase() === "active";
            return {
              ...p,
              condotelName:
                p.condotelName ||
                condotelsData.find((c: any) => c.condotelId === p.condotelId)?.name ||
                `Condotel #${p.condotelId}`,
              isActive: active,
              status: active ? "Active" : "Inactive",
            };
          });
          setPromotions(promotionsWithNames);
        } catch (e) {
          // Skip if condotel has no promotions
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách khuyến mãi");
      // Set empty arrays on error
      setPromotions([]);
      setCondotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promotionId: number, title: string) => {
    toast.info(`Xóa promotion "${title}"?`, {
      position: "bottom-center",
      autoClose: false,
      closeButton: true,
    });

    setDeletingId(promotionId);
    try {
      await condotelAPI.deletePromotion(promotionId);
      await loadData();
      toast.success("✅ Xóa promotion thành công!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể xóa promotion";
      toast.error(`❌ ${errorMsg}`);
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
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Danh sách khuyến mãi
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý các chương trình khuyến mãi cho condotel của bạn
          </p>
        </div>
        <ButtonPrimary 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm khuyến mãi
          </span>
        </ButtonPrimary>
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
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 dark:border-orange-800"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-orange-50/30 dark:from-neutral-800 dark:to-orange-900/10 rounded-2xl shadow-xl border border-orange-200/50 dark:border-orange-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có khuyến mãi nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Bắt đầu bằng cách tạo khuyến mãi mới cho condotel của bạn.
          </p>
          <ButtonPrimary 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm khuyến mãi đầu tiên
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promotion) => (
            <div
              key={promotion.promotionId}
              className="bg-gradient-to-br from-white to-orange-50/30 dark:from-neutral-800 dark:to-orange-900/10 rounded-2xl shadow-xl p-6 border border-orange-200/50 dark:border-orange-800/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                    {promotion.name}
                  </h3>
                  {promotion.condotelName && (
                    <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {promotion.condotelName}
                    </div>
                  )}
                </div>
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md ${
                    ((promotion.status || "").toLowerCase() === "active" || promotion.isActive === true || (promotion as any).isActive === "true")
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                  }`}
                >
                  {((promotion.status || "").toLowerCase() === "active" || promotion.isActive === true || (promotion as any).isActive === "true") ? "Đang hoạt động" : "Đã tắt"}
                </span>
              </div>

              {promotion.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                  {promotion.description}
                </p>
              )}

              <div className="space-y-2 mb-4">
                {promotion.discountPercentage && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      Giảm giá:
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {promotion.discountPercentage}%
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Từ:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {formatDate(promotion.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Đến:</span>
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {formatDate(promotion.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-orange-200 dark:border-orange-800">
                <ButtonSecondary
                  onClick={() => setEditingPromotion(promotion)}
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
                  onClick={() => handleDelete(promotion.promotionId, promotion.name)}
                  disabled={deletingId === promotion.promotionId}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingId === promotion.promotionId ? (
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
      {(showAddModal || editingPromotion) && (
        <PromotionModal
          condotels={condotels}
          promotion={editingPromotion}
          onClose={() => {
            setShowAddModal(false);
            setEditingPromotion(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingPromotion(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Promotion Modal Component
interface PromotionModalProps {
  condotels: CondotelDTO[];
  promotion?: PromotionDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  condotels,
  promotion,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    condotelId: promotion?.condotelId || 0,
    name: promotion?.name || "",
    description: promotion?.description || "",
    discountPercentage: promotion?.discountPercentage || undefined,
    startDate: promotion?.startDate || "",
    endDate: promotion?.endDate || "",
    isActive: promotion?.isActive !== undefined ? promotion.isActive : true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localCondotels, setLocalCondotels] = useState<CondotelDTO[]>(condotels);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Ensure we have condotels even if parent hasn't loaded yet
  useEffect(() => {
    setLocalCondotels(condotels);
  }, [condotels]);

  useEffect(() => {
    const ensureCondotels = async () => {
      if (!localCondotels || localCondotels.length === 0) {
        try {
          const data = await condotelAPI.getAllForHost();
          setLocalCondotels(data);
        } catch (e) {
          // ignore, dropdown will show empty state
        }
      }
    };
    ensureCondotels();
  }, [localCondotels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.condotelId) {
      setError("Vui lòng chọn condotel!");
      return;
    }
    if (!formData.name || !formData.name.trim()) {
      setError("Vui lòng nhập tiêu đề!");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError("Vui lòng chọn ngày bắt đầu và kết thúc!");
      return;
    }
    
    // Validate dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate < today) {
      setError("⚠️ Ngày bắt đầu không được ở quá khứ!");
      return;
    }
    
    if (endDate < today) {
      setError("⚠️ Ngày kết thúc không được ở quá khứ!");
      return;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError("Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }
    if (!formData.discountPercentage) {
      setError("Vui lòng nhập phần trăm giảm giá!");
      return;
    }

    setLoading(true);
    try {
      if (promotion) {
        // Update promotion
        await condotelAPI.updatePromotion(promotion.promotionId, {
          condotelId: formData.condotelId,
          name: formData.name.trim(),
          description: formData.description?.trim(),
          discountPercentage: formData.discountPercentage,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          status: formData.isActive ? "Active" : "Inactive",
        });
        showSuccess("✅ Cập nhật promotion thành công!");
      } else {
        // Create promotion
        await condotelAPI.createPromotion({
          condotelId: formData.condotelId,
          name: formData.name.trim(),
          description: formData.description?.trim(),
          discountPercentage: formData.discountPercentage,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          status: formData.isActive ? "Active" : "Inactive",
        });
        showSuccess("✅ Tạo promotion thành công!");
      }
      // Delay slightly to show success message before closing
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      let errorMessage = "❌ Không thể lưu promotion. Vui lòng thử lại!";

      if (err.response?.data?.message) {
        errorMessage = `❌ ${translateErrorMessage(err.response.data.message)}`;
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
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ position: 'fixed', width: '100%', height: '100%' }}>
      <div
        className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {promotion ? "Sửa Khuyến mãi" : "Thêm Khuyến mãi mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Condotel *
                </label>
                <select
                  value={formData.condotelId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, condotelId: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                  disabled={false}
                >
                  <option value={0}>-- Chọn condotel --</option>
                  {(localCondotels || []).map((condotel) => (
                    <option key={condotel.condotelId} value={condotel.condotelId}>
                      {condotel.name || (condotel as any).condotelName || `Condotel #${condotel.condotelId}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
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
                        discountPercentage: e.target.value ? Number(e.target.value) : undefined,
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
                  {loading ? "Đang lưu..." : promotion ? "Cập nhật" : "Tạo mới"}
                </ButtonPrimary>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default HostPromotionContent;

