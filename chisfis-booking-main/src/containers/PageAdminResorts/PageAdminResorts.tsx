import React, { useState, useEffect } from "react";
import resortAPI, { ResortDTO } from "api/resort";
import locationAPI, { LocationDTO } from "api/location";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";

const PageAdminResorts: React.FC = () => {
  const [resorts, setResorts] = useState<ResortDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingResort, setEditingResort] = useState<ResortDTO | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadResorts();
    loadLocations();
  }, []);

  const loadResorts = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await resortAPI.getAllAdmin();
      setResorts(data);
    } catch (err: any) {
      console.error("Failed to load resorts:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách resorts");
      setResorts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    setLoadingLocations(true);
    try {
      const data = await locationAPI.getAllAdmin();
      setLocations(data);
    } catch (err: any) {
      console.error("Failed to load locations:", err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa resort "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await resortAPI.deleteAdmin(id);
      setSuccess(`Đã xóa resort "${name}" thành công!`);
      await loadResorts();
    } catch (err: any) {
      console.error("Failed to delete resort:", err);
      setError(err.response?.data?.message || "Không thể xóa resort");
    } finally {
      setDeletingId(null);
    }
  };

  const getLocationName = (locationId?: number): string => {
    if (!locationId) return "-";
    const location = locations.find((loc) => loc.locationId === locationId);
    return location ? location.locationName : `Location #${locationId}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 dark:border-amber-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Quản lý Resorts
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý tất cả resorts trong hệ thống
          </p>
        </div>
        <ButtonPrimary 
          onClick={() => {
            setEditingResort(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm Resort
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

      {resorts.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-amber-50/30 dark:from-neutral-800 dark:to-amber-900/10 rounded-2xl shadow-xl border border-amber-200/50 dark:border-amber-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có resort nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Bắt đầu bằng cách tạo resort mới cho hệ thống.
          </p>
          <ButtonPrimary 
            onClick={() => {
              setEditingResort(null);
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm resort đầu tiên
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-amber-200/50 dark:border-amber-800/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-neutral-700 dark:to-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Tên Resort
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Địa chỉ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Thành phố / Quốc gia
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {resorts.map((resort) => (
                  <tr key={resort.resortId} className="hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/50 dark:hover:from-neutral-700/50 dark:hover:to-neutral-800/50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 font-bold">
                        #{resort.resortId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {resort.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                      {resort.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {getLocationName(resort.locationId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      {resort.address || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {resort.city || "-"} {resort.country ? `, ${resort.country}` : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <ButtonSecondary
                        onClick={() => {
                          setEditingResort(resort);
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
                        onClick={() => handleDelete(resort.resortId, resort.name)}
                        disabled={deletingId === resort.resortId}
                        className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {deletingId === resort.resortId ? (
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
        <ResortModal
          resort={editingResort}
          locations={locations}
          loadingLocations={loadingLocations}
          onClose={() => {
            setShowModal(false);
            setEditingResort(null);
            setError("");
            setSuccess("");
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingResort(null);
            setError("");
            setSuccess("");
            loadResorts();
          }}
        />
      )}
    </div>
  );
};

// Resort Modal Component
interface ResortModalProps {
  resort?: ResortDTO | null;
  locations: LocationDTO[];
  loadingLocations: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ResortModal: React.FC<ResortModalProps> = ({ resort, locations, loadingLocations, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Omit<ResortDTO, 'resortId'>>({
    name: resort?.name || "",
    description: resort?.description || "",
    locationId: resort?.locationId,
    address: resort?.address || "",
    city: resort?.city || "",
    country: resort?.country || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    if (!formData.name || !formData.name.trim()) {
      setError("Vui lòng nhập tên resort!");
      return;
    }

    setLoading(true);
    try {
      if (resort) {
        await resortAPI.updateAdmin(resort.resortId, formData);
        alert("Cập nhật resort thành công!");
      } else {
        await resortAPI.createAdmin(formData);
        alert("Tạo resort thành công!");
      }
      onSuccess();
    } catch (err: any) {
      console.error("Failed to save resort:", err);
      setError(err.response?.data?.message || "Không thể lưu resort. Vui lòng thử lại!");
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
            <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {resort ? "Sửa Resort" : "Thêm Resort mới"}
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
                  Tên Resort *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
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
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Location
                </label>
                {loadingLocations ? (
                  <div className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700">
                    <span className="text-sm text-neutral-500">Đang tải danh sách locations...</span>
                  </div>
                ) : (
                  <select
                    value={formData.locationId || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, locationId: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                  >
                    <option value="">-- Chọn Location (Tùy chọn) --</option>
                    {locations.map((location) => (
                      <option key={location.locationId} value={location.locationId}>
                        {location.locationName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Thành phố
                  </label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Quốc gia
                  </label>
                  <input
                    type="text"
                    value={formData.country || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                  />
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
                  {loading ? "Đang lưu..." : resort ? "Cập nhật" : "Tạo mới"}
                </ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageAdminResorts;
