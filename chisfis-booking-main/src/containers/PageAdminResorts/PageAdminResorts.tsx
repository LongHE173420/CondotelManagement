import React, { useState, useEffect } from "react";
import resortAPI, { ResortDTO, ResortUtilityRequestDTO, ResortUtilityDTO } from "api/resort";
import locationAPI, { LocationDTO } from "api/location";
import utilityAPI, { UtilityDTO } from "api/utility";
import vietnamAddressAPI from "api/vietnamAddress";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { toastError, toastSuccess } from "utils/toast";

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
  const [showUtilitiesModal, setShowUtilitiesModal] = useState(false);
  const [selectedResortForUtilities, setSelectedResortForUtilities] = useState<ResortDTO | null>(null);
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
      const errorMsg = err.response?.data?.message || "Không thể tải danh sách resorts";
      setError(errorMsg);
      toastError(errorMsg);
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
      toastError("Không thể tải danh sách địa điểm");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Resort",
      message: `Bạn có chắc chắn muốn xóa resort "${name}"?`,
      action: async () => {
        setDeletingId(id);
        try {
          await resortAPI.deleteAdmin(id);
          setSuccess(`Đã xóa resort "${name}" thành công!`);
          await loadResorts();
          toastSuccess(`Đã xóa resort "${name}" thành công!`);
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || "Không thể xóa resort";
          setError(errorMsg);
          toastError(errorMsg);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const getLocationName = (locationId?: number): string => {
    if (!locationId) return "-";
    const location = locations.find((loc) => loc.locationId === locationId);
    return location ? (location.name || `Location #${locationId}`) : `Location #${locationId}`;
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
                      <ButtonSecondary
                        onClick={() => {
                          setSelectedResortForUtilities(resort);
                          setShowUtilitiesModal(true);
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Utilities
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

      {/* Utilities Management Modal */}
      {showUtilitiesModal && selectedResortForUtilities && (
        <ResortUtilitiesModal
          resort={selectedResortForUtilities}
          onClose={() => {
            setShowUtilitiesModal(false);
            setSelectedResortForUtilities(null);
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationDTO | null>(null);
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [wardsList, setWardsList] = useState<string[]>([]);
  const [districtsList, setDistrictsList] = useState<string[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load selected location details when locationId changes
  useEffect(() => {
    const loadLocationData = async () => {
      if (formData.locationId) {
        const location = locations.find(l => l.locationId === formData.locationId);
        if (location) {
          setSelectedLocation(location);
          
          // Nếu location có ward/district, set giá trị mặc định
          if (location.ward) {
            setSelectedWard(location.ward);
          }
          if (location.district) {
            setSelectedDistrict(location.district);
          }

          // Load danh sách quận/huyện từ API bên ngoài (provinces.open-api.vn)
          setLoadingDistricts(true);
          setLoadingWards(true);
          try {
            // Thử lấy từ API bên ngoài trước
            const externalDistricts = await vietnamAddressAPI.getDistrictsByProvinceName(location.name);
            
            if (externalDistricts.length > 0) {
              setDistrictsList(externalDistricts);
            } else {
              // Fallback: thử lấy từ API internal
              const internalDistricts = await locationAPI.getDistrictsByLocationIdPublic(location.locationId);
              setDistrictsList(internalDistricts);
            }
            
            // Wards sẽ được load khi chọn district
            setWardsList([]);
          } catch (err) {
            // Fallback: thử lấy từ API internal
            try {
              const internalDistricts = await locationAPI.getDistrictsByLocationIdPublic(location.locationId);
              setDistrictsList(internalDistricts);
            } catch (fallbackErr) {
              setDistrictsList([]);
            }
          } finally {
            setLoadingDistricts(false);
            setLoadingWards(false);
          }
        } else {
          setSelectedLocation(null);
          setSelectedWard("");
          setSelectedDistrict("");
          setDistrictsList([]);
          setWardsList([]);
        }
      } else {
        setSelectedLocation(null);
        setSelectedWard("");
        setSelectedDistrict("");
        setDistrictsList([]);
        setWardsList([]);
      }
    };

    loadLocationData();
  }, [formData.locationId, locations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.name.trim()) {
      setError("Vui lòng nhập tên resort!");
      return;
    }

    setLoading(true);
    try {
      // Tạo address đầy đủ: Xã/Phường, Quận/Huyện, Tỉnh/Thành phố, [địa chỉ chi tiết]
      const addressParts: string[] = [];
      
      // Thêm Xã/Phường nếu có
      if (selectedWard && selectedWard.trim()) {
        addressParts.push(selectedWard.trim());
      }
      
      // Thêm Quận/Huyện nếu có
      if (selectedDistrict && selectedDistrict.trim()) {
        addressParts.push(selectedDistrict.trim());
      }
      
      // Thêm Tỉnh/Thành phố nếu có location
      if (selectedLocation && selectedLocation.name) {
        addressParts.push(selectedLocation.name);
      }
      
      // Thêm địa chỉ chi tiết nếu có
      if (formData.address && formData.address.trim()) {
        addressParts.push(formData.address.trim());
      }
      
      // Ghép tất cả bằng dấu phẩy
      const fullAddress = addressParts.join(", ");

      const submitData = {
        ...formData,
        address: fullAddress || formData.address || "",
      };

      if (resort) {
        await resortAPI.updateAdmin(resort.resortId, submitData);
        toastSuccess("Cập nhật resort thành công!");
      } else {
        await resortAPI.createAdmin(submitData);
        toastSuccess("Tạo resort thành công!");
      }
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể lưu resort. Vui lòng thử lại!";
      setError(errorMsg);
      toastError(errorMsg);
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
                  Tỉnh/Thành phố *
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
                    required
                  >
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {locations.map((location) => (
                      <option key={location.locationId} value={location.locationId}>
                        {location.name || `Location #${location.locationId}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Luôn hiển thị Quận/Huyện khi đã chọn location */}
              {selectedLocation && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Quận/Huyện
                  </label>
                  {loadingDistricts ? (
                    <div className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700">
                      <span className="text-sm text-neutral-500">Đang tải danh sách quận/huyện...</span>
                    </div>
                  ) : districtsList.length > 0 ? (
                    <select
                      value={selectedDistrict}
                      onChange={async (e) => {
                        const districtName = e.target.value;
                        setSelectedDistrict(districtName);
                        setSelectedWard(""); // Reset ward khi đổi district
                        
                        // Load danh sách xã/phường từ API bên ngoài
                        if (districtName && selectedLocation) {
                          setLoadingWards(true);
                          try {
                            const externalWards = await vietnamAddressAPI.getWardsByProvinceAndDistrict(
                              selectedLocation.name,
                              districtName
                            );
                            
                            if (externalWards.length > 0) {
                              setWardsList(externalWards);
                            } else {
                              // Fallback: thử lấy từ API internal
                              const internalWards = await locationAPI.getWardsByLocationIdPublic(selectedLocation.locationId);
                              setWardsList(internalWards);
                            }
                          } catch (err) {
                            // Fallback: thử lấy từ API internal
                            try {
                              const internalWards = await locationAPI.getWardsByLocationIdPublic(selectedLocation.locationId);
                              setWardsList(internalWards);
                            } catch (fallbackErr) {
                              setWardsList([]);
                            }
                          } finally {
                            setLoadingWards(false);
                          }
                        } else {
                          setWardsList([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {districtsList.map((district, index) => (
                        <option key={index} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        placeholder={`Nhập quận/huyện thuộc ${selectedLocation.name}`}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                      />
                      {selectedLocation.district && (
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Gợi ý: {selectedLocation.district}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Luôn hiển thị Xã/Phường khi đã chọn location và district */}
              {selectedLocation && selectedDistrict && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Xã/Phường
                  </label>
                  {loadingWards ? (
                    <div className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700">
                      <span className="text-sm text-neutral-500">Đang tải danh sách xã/phường...</span>
                    </div>
                  ) : wardsList.length > 0 ? (
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="">-- Chọn Xã/Phường --</option>
                      {wardsList.map((ward, index) => (
                        <option key={index} value={ward}>
                          {ward}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        placeholder={`Nhập xã/phường thuộc ${selectedDistrict}, ${selectedLocation.name}`}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-neutral-700 dark:text-neutral-100"
                      />
                      {selectedLocation.ward && (
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Gợi ý: {selectedLocation.ward}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

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

// Resort Utilities Modal Component
interface ResortUtilitiesModalProps {
  resort: ResortDTO;
  onClose: () => void;
}

const ResortUtilitiesModal: React.FC<ResortUtilitiesModalProps> = ({ resort, onClose }) => {
  const [resortUtilities, setResortUtilities] = useState<ResortUtilityDTO[]>([]);
  const [allUtilities, setAllUtilities] = useState<UtilityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUtilities, setLoadingUtilities] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingUtilityId, setDeletingUtilityId] = useState<number | null>(null);
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
    loadData();
  }, [resort.resortId]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [utilitiesData, allUtilitiesData] = await Promise.all([
        resortAPI.getUtilitiesByResortAdmin(resort.resortId),
        utilityAPI.getAllAdmin(),
      ]);
      setResortUtilities(utilitiesData);
      setAllUtilities(allUtilitiesData);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tải danh sách utilities";
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUtility = async (utilityData: ResortUtilityRequestDTO) => {
    setLoadingUtilities(true);
    setError("");
    try {
      await resortAPI.addUtility(resort.resortId, utilityData);
      setSuccess("Thêm utility thành công!");
      await loadData();
      setShowAddModal(false);
      toastSuccess("Thêm utility thành công!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể thêm utility";
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setLoadingUtilities(false);
    }
  };

  const handleRemoveUtility = (utilityId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Utility",
      message: "Bạn có chắc chắn muốn xóa utility này khỏi resort?",
      action: async () => {
        setDeletingUtilityId(utilityId);
        setError("");
        try {
          await resortAPI.removeUtility(resort.resortId, utilityId);
          setSuccess("Xóa utility thành công!");
          await loadData();
          toastSuccess("Xóa utility thành công!");
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || "Không thể xóa utility";
          setError(errorMsg);
          toastError(errorMsg);
        } finally {
          setDeletingUtilityId(null);
        }
      },
    });
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

        <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Quản lý Utilities - {resort.name}
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
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Danh sách Utilities ({resortUtilities.length})
              </h4>
              <ButtonPrimary
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm Utility
                </span>
              </ButtonPrimary>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200 dark:border-green-800 border-t-green-600"></div>
              </div>
            ) : resortUtilities.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                Chưa có utility nào cho resort này
              </div>
            ) : (
              <div className="space-y-3">
                {resortUtilities.map((utility) => (
                  <div
                    key={utility.utilityId}
                    className="p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border border-neutral-200 dark:border-neutral-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                          {utility.name}
                        </h5>
                        {utility.description && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                            {utility.description}
                          </p>
                        )}
                        {utility.category && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            {utility.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveUtility(utility.utilityId)}
                        disabled={deletingUtilityId === utility.utilityId}
                        className="ml-4 px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {deletingUtilityId === utility.utilityId ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Utility Modal */}
      {showAddModal && (
        <AddUtilityToResortModal
          resort={resort}
          allUtilities={allUtilities}
          existingUtilityIds={resortUtilities.map(u => u.utilityId)}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddUtility}
          loading={loadingUtilities}
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

// Add Utility to Resort Modal
interface AddUtilityToResortModalProps {
  resort: ResortDTO;
  allUtilities: UtilityDTO[];
  existingUtilityIds: number[];
  onClose: () => void;
  onAdd: (utility: ResortUtilityRequestDTO) => void;
  loading: boolean;
}

const AddUtilityToResortModal: React.FC<AddUtilityToResortModalProps> = ({
  resort,
  allUtilities,
  existingUtilityIds,
  onClose,
  onAdd,
  loading,
}) => {
  const [formData, setFormData] = useState<ResortUtilityRequestDTO>({
    utilityId: 0,
    status: "Active",
    operatingHours: "",
    cost: undefined,
    descriptionDetail: "",
    maximumCapacity: undefined,
  });
  const [error, setError] = useState("");

  const availableUtilities = allUtilities.filter(u => !existingUtilityIds.includes(u.utilityId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.utilityId || formData.utilityId === 0) {
      setError("Vui lòng chọn utility!");
      return;
    }

    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ position: 'fixed', width: '100%', height: '100%' }}>
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Thêm Utility cho {resort.name}
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
                  Utility *
                </label>
                <select
                  value={formData.utilityId || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, utilityId: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                >
                  <option value="">-- Chọn Utility --</option>
                  {availableUtilities.map((utility) => (
                    <option key={utility.utilityId} value={utility.utilityId}>
                      {utility.name} {utility.category ? `(${utility.category})` : ""}
                    </option>
                  ))}
                </select>
                {availableUtilities.length === 0 && (
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Tất cả utilities đã được thêm vào resort này
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status || "Active"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-neutral-700 dark:text-neutral-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Giờ hoạt động
                </label>
                <input
                  type="text"
                  value={formData.operatingHours || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, operatingHours: e.target.value }))}
                  placeholder="Ví dụ: 8:00 - 22:00"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Chi phí (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.cost || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Sức chứa tối đa
                  </label>
                  <input
                    type="number"
                    value={formData.maximumCapacity || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maximumCapacity: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={formData.descriptionDetail || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descriptionDetail: e.target.value }))}
                  rows={3}
                  placeholder="Mô tả chi tiết về utility này trong resort..."
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <ButtonSecondary onClick={onClose}>Hủy</ButtonSecondary>
                <ButtonPrimary type="submit" disabled={loading}>
                  {loading ? "Đang thêm..." : "Thêm Utility"}
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
