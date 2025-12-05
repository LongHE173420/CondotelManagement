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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Resorts</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Quản lý tất cả resorts trong hệ thống
          </p>
        </div>
        <ButtonPrimary onClick={() => {
          setEditingResort(null);
          setShowModal(true);
        }}>
          + Thêm Resort
        </ButtonPrimary>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {resorts.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-12 text-center">
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Chưa có resort nào
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Bắt đầu bằng cách tạo resort mới.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Tên Resort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Địa chỉ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Thành phố / Quốc gia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {resorts.map((resort) => (
                  <tr key={resort.resortId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      #{resort.resortId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
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
                      >
                        Sửa
                      </ButtonSecondary>
                      <button
                        onClick={() => handleDelete(resort.resortId, resort.name)}
                        disabled={deletingId === resort.resortId}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {deletingId === resort.resortId ? "Đang xóa..." : "Xóa"}
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {resort ? "Sửa Resort" : "Thêm Resort mới"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên Resort *
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
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
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
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
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
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
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
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
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



