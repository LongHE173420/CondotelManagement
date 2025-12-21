import React, { useState, useEffect, useRef } from "react";
import locationAPI, { LocationDTO, LocationCreateUpdateDTO } from "api/location";
import uploadAPI from "api/upload";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { toastSuccess, showErrorMessage } from "utils/toast";

const PageAdminLocations: React.FC = () => {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDTO | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Modal confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: null,
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await locationAPI.getAllAdmin();
      setLocations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách locations");
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Location",
      message: `Bạn có chắc chắn muốn xóa location "${name}"? Hành động này không thể hoàn tác.`,
      action: async () => {
        setDeletingId(id);
        try {
          await locationAPI.deleteAdmin(id);
          setSuccess(`Đã xóa location "${name}" thành công!`);
          await loadLocations();
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        } catch (err: any) {
          setError(err.response?.data?.message || "Không thể xóa location");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Quản lý Locations
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý tất cả locations trong hệ thống
          </p>
        </div>
        <ButtonPrimary 
          onClick={() => {
            setEditingLocation(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm Location
          </span>
        </ButtonPrimary>
      </div>

      {error && (
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 text-green-800 dark:text-green-200 rounded-xl shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess("")}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-900/10 rounded-2xl shadow-xl border border-emerald-200/50 dark:border-emerald-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có location nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Bắt đầu bằng cách tạo location mới cho hệ thống.
          </p>
          <ButtonPrimary 
            onClick={() => {
              setEditingLocation(null);
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm location đầu tiên
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-emerald-200/50 dark:border-emerald-800/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-neutral-700 dark:to-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Ảnh
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Tên Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {locations.map((location) => (
                  <tr key={location.locationId} className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-neutral-700/50 dark:hover:to-neutral-800/50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 font-bold">
                        #{location.locationId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {location.imageUrl ? (
                        <img
                          src={location.imageUrl}
                          alt={location.name}
                          className="w-16 h-16 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {location.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                      {location.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <ButtonSecondary
                        onClick={() => {
                          setEditingLocation(location);
                          setShowModal(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sửa
                        </span>
                      </ButtonSecondary>
                      <button
                        onClick={() => handleDelete(location.locationId, location.name)}
                        disabled={deletingId === location.locationId}
                        className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {deletingId === location.locationId ? (
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <LocationModal
          location={editingLocation}
          onClose={() => {
            setShowModal(false);
            setEditingLocation(null);
            setError("");
            setSuccess("");
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingLocation(null);
            setError("");
            setSuccess("");
            loadLocations();
          }}
        />
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl p-6 max-w-sm w-11/12">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", action: null })}
                className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => confirmModal.action?.()}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Location Modal Component
interface LocationModalProps {
  location?: LocationDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ location, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<LocationCreateUpdateDTO>({
    name: location?.name || "",
    description: location?.description || "",
    imageUrl: location?.imageUrl || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(location?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Ảnh không được quá 10MB!");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const res = await uploadAPI.uploadImage(file);
      if (res?.imageUrl && res.imageUrl.trim()) {
        setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
        setImagePreview(res.imageUrl);
      } else {
        throw new Error("Không nhận được URL ảnh từ server");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Upload ảnh thất bại!");
      setImagePreview(location?.imageUrl || null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.name.trim()) {
      setError("Vui lòng nhập tên location!");
      return;
    }

    setLoading(true);
    try {
      if (location) {
        await locationAPI.updateAdmin(location.locationId, formData);
        toastSuccess("Cập nhật location thành công!");
      } else {
        await locationAPI.createAdmin(formData);
        toastSuccess("Tạo location thành công!");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể lưu location. Vui lòng thử lại!");
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
          <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {location ? "Sửa Location" : "Thêm Location mới"}
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
                  Tên Location *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="Nhập mô tả về location..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Ảnh Location
                </label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-neutral-300 dark:border-neutral-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData((prev) => ({ ...prev, imageUrl: "" }));
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex-1 px-4 py-2 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors text-center ${
                        uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {uploadingImage ? (
                        <span className="flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang upload...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {imagePreview ? "Thay đổi ảnh" : "Chọn ảnh"}
                        </span>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Chọn ảnh để upload (JPG, PNG, GIF - tối đa 10MB)
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <ButtonSecondary onClick={onClose}>Hủy</ButtonSecondary>
                <ButtonPrimary type="submit" disabled={loading}>
                  {loading ? "Đang lưu..." : location ? "Cập nhật" : "Tạo mới"}
                </ButtonPrimary>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default PageAdminLocations;
