import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { condotelAPI, CondotelDTO, PromotionDTO } from "api/condotel";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import ConfirmModal from "components/ConfirmModal";

export interface HostPromotionPageProps {
  className?: string;
}

const HostPromotionPage: React.FC<HostPromotionPageProps> = ({ className = "" }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionDTO | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingPromotionId, setDeletingPromotionId] = useState<number | null>(null);
  const [deletingPromotionName, setDeletingPromotionName] = useState<string>("");

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const condotelsData = await condotelAPI.getAllForHost();
      // Load promotions từ condotel API
      let promotionsData: PromotionDTO[] = [];
      try {
        promotionsData = await condotelAPI.getPromotions();
      } catch (promoErr: any) {
        // Nếu endpoint getPromotions không có condotelId không work, 
        // thử lấy promotions từ từng condotel
        for (const condotel of condotelsData) {
          try {
            const allPromotions = await condotelAPI.getPromotions(); // ← Lấy hết luôn
            setPromotions(allPromotions);

          } catch (e) {
            // Skip if condotel has no promotions
          }
        }
      }
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
      setCondotels(condotelsData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promotionId: number, name: string) => {
    setDeletingPromotionId(promotionId);
    setDeletingPromotionName(name);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingPromotionId) return;
    setShowConfirmModal(false);
    setDeletingId(deletingPromotionId);
    try {
      await condotelAPI.deletePromotion(deletingPromotionId);
      await loadData();
      alert("Xóa promotion thành công!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể xóa promotion");
    } finally {
      setDeletingId(null);
      setDeletingPromotionId(null);
      setDeletingPromotionName("");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`nc-HostPromotionPage ${className}`} data-nc-id="HostPromotionPage">
      <Helmet>
        <title>Quản lý Khuyến mãi || Fiscondotel</title>
      </Helmet>

      <div className="container py-8 lg:py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                Quản lý Khuyến mãi
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                Tạo và quản lý các chương trình khuyến mãi cho condotel của bạn
              </p>
            </div>
            <ButtonPrimary onClick={() => setShowAddModal(true)}>
              + Thêm khuyến mãi
            </ButtonPrimary>
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
        ) : promotions.length === 0 ? (
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
              Chưa có khuyến mãi nào
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Bắt đầu bằng cách tạo khuyến mãi mới cho condotel của bạn.
            </p>
            <div className="mt-6">
              <ButtonPrimary onClick={() => setShowAddModal(true)}>
                + Thêm khuyến mãi đầu tiên
              </ButtonPrimary>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promotion) => (
              <div
                key={promotion.promotionId}
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {promotion.name}
                    </h3>
                    {promotion.condotelName && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {promotion.condotelName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${((promotion.status || "").toLowerCase() === "active" || promotion.isActive === true || (promotion as any).isActive === "true")
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
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
                  {promotion.discountAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        Giảm giá:
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(promotion.discountAmount)}
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

                <div className="flex items-center space-x-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <ButtonSecondary
                    onClick={() => setEditingPromotion(promotion)}
                    className="flex-1"
                  >
                    Sửa
                  </ButtonSecondary>
                  <button
                    onClick={() => handleDelete(promotion.promotionId, promotion.name)}
                    disabled={deletingId === promotion.promotionId}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400"
                  >
                    {deletingId === promotion.promotionId ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        // Update promotion - PUT /api/promotion/{id}
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
        alert("Cập nhật promotion thành công!");
      } else {
        // Create promotion - POST /api/promotion
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
        alert("Tạo promotion thành công!");
      }
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors ||
        "Không thể lưu promotion. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ position: 'fixed', width: '100%', height: '100%' }}>
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {promotion ? "Sửa Khuyến mãi" : "Thêm Khuyến mãi mới"}
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
                  Condotel *
                </label>
                <select
                  value={formData.condotelId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, condotelId: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                  disabled={!!promotion}
                >
                  <option value={0}>-- Chọn condotel --</option>
                  {condotels.map((condotel) => (
                    <option key={condotel.condotelId} value={condotel.condotelId}>
                      {condotel.name}
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
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
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
    </div>
  );
};

export default HostPromotionPage;


