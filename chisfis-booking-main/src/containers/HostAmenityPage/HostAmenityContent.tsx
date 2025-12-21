import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import amenityAPI, { AmenityDTO, AmenityRequestDTO } from "api/amenity";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { toast } from "react-toastify";

const HostAmenityContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [amenities, setAmenities] = useState<AmenityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityDTO | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

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
      const amenitiesData = await amenityAPI.getAll();
      setAmenities(amenitiesData);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(amenitiesData.map((a) => a.category).filter((c) => c))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách tiện ích");
      setAmenities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadByCategory = async (category: string) => {
    if (!category) {
      loadData();
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const amenitiesData = await amenityAPI.getByCategory(category);
      setAmenities(amenitiesData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách tiện ích");
      setAmenities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category) {
      loadByCategory(category);
    } else {
      loadData();
    }
  };

  const handleDelete = async (amenityId: number, name: string) => {
    // Use toast instead of window.confirm
    toast.info(`Xóa tiện ích "${name}"?`, {
      position: "bottom-center",
      autoClose: false,
      closeButton: true,
    });

    // For now, just proceed with delete
    setDeletingId(amenityId);
    try {
      await amenityAPI.delete(amenityId);
      await loadData();
      toast.success("✅ Xóa tiện ích thành công!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể xóa tiện ích. Có thể tiện ích đang được sử dụng bởi một số condotel.";
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Common categories for amenities
  const commonCategories = [
    "Tiện ích cơ bản",
    "Tiện ích phòng tắm",
    "Tiện ích phòng ngủ",
    "Tiện ích bếp",
    "Tiện ích giải trí",
    "Tiện ích an ninh",
    "Tiện ích khác",
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 rounded-2xl p-6 border border-violet-200/50 dark:border-violet-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
            Quản lý Tiện ích
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý các tiện ích cho condotel của bạn
          </p>
        </div>
        <ButtonPrimary 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm tiện ích
          </span>
        </ButtonPrimary>
      </div>

      {/* Category Filter */}
      <div className="mb-6 bg-gradient-to-br from-white to-violet-50/30 dark:from-neutral-800 dark:to-violet-900/10 rounded-2xl shadow-xl p-6 border border-violet-200/50 dark:border-violet-800/50">
        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">
          Lọc theo danh mục:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange("")}
            className={`px-4 py-2 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${
              !selectedCategory
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                : "bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20"
            }`}
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  : "bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20"
              }`}
            >
              {category}
            </button>
          ))}
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
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-800"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : amenities.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-violet-50/30 dark:from-neutral-800 dark:to-violet-900/10 rounded-2xl shadow-xl border border-violet-200/50 dark:border-violet-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có tiện ích nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Bắt đầu bằng cách tạo tiện ích mới cho condotel của bạn.
          </p>
          <ButtonPrimary 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm tiện ích đầu tiên
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {amenities.map((amenity) => (
            <div
              key={amenity.amenityId}
              className="bg-gradient-to-br from-white to-violet-50/30 dark:from-neutral-800 dark:to-violet-900/10 rounded-2xl shadow-xl p-6 border border-violet-200/50 dark:border-violet-800/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                    {amenity.name}
                  </h3>
                  {amenity.category && (
                    <div className="flex items-center text-sm text-violet-600 dark:text-violet-400 mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {amenity.category}
                    </div>
                  )}
                  {amenity.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {amenity.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-violet-200 dark:border-violet-800">
                <ButtonSecondary
                  onClick={() => {
                    setEditingAmenity(amenity);
                    setShowAddModal(true);
                  }}
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
                  onClick={() => handleDelete(amenity.amenityId, amenity.name)}
                  disabled={deletingId === amenity.amenityId}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingId === amenity.amenityId ? (
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
      {(showAddModal || editingAmenity) && (
        <AmenityModal
          amenity={editingAmenity}
          onClose={() => {
            setShowAddModal(false);
            setEditingAmenity(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingAmenity(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Amenity Modal Component
interface AmenityModalProps {
  amenity?: AmenityDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AmenityModal: React.FC<AmenityModalProps> = ({
  amenity,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<AmenityRequestDTO>({
    name: amenity?.name || "",
    description: amenity?.description || "",
    category: amenity?.category || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Common categories for amenities
  const commonCategories = [
    "Tiện ích cơ bản",
    "Tiện ích phòng tắm",
    "Tiện ích phòng ngủ",
    "Tiện ích bếp",
    "Tiện ích giải trí",
    "Tiện ích an ninh",
    "Tiện ích khác",
  ];

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.name.trim()) {
      setError("Vui lòng nhập tên tiện ích!");
      return;
    }

    setLoading(true);
    try {
      if (amenity) {
        // Update amenity
        await amenityAPI.update(amenity.amenityId, {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          category: formData.category?.trim() || undefined,
        });
        toast.success("✅ Cập nhật tiện ích thành công!");
      } else {
        // Create amenity
        await amenityAPI.create({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          category: formData.category?.trim() || undefined,
        });
        toast.success("✅ Tạo tiện ích thành công!");
      }
      onSuccess();
    } catch (err: any) {
      let errorMessage = "Không thể lưu tiện ích. Vui lòng thử lại!";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ position: 'fixed', width: '100%', height: '100%' }}>
      <div
        className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            {amenity ? "Sửa Tiện ích" : "Thêm Tiện ích mới"}
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
                  Tên tiện ích *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                  placeholder="VD: WiFi miễn phí, Điều hòa, TV..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Danh mục
                </label>
                <select
                  value={formData.category || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-neutral-700 dark:text-neutral-100 mb-2"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {commonCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Hoặc nhập danh mục tùy chỉnh"
                  value={formData.category || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="Mô tả về tiện ích..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <ButtonSecondary onClick={onClose}>Hủy</ButtonSecondary>
                <ButtonPrimary type="submit" disabled={loading}>
                  {loading ? "Đang lưu..." : amenity ? "Cập nhật" : "Tạo mới"}
                </ButtonPrimary>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default HostAmenityContent;


