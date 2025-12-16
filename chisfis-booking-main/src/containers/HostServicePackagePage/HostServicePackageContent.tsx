import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import servicePackageAPI, { ServicePackageDTO, CreateServicePackageDTO, UpdateServicePackageDTO } from "api/servicePackage";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";

const HostServicePackageContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [servicePackages, setServicePackages] = useState<ServicePackageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackageDTO | null>(null);
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
      const packagesData = await servicePackageAPI.getAll();
      setServicePackages(packagesData);
    } catch (err: any) {
      console.error("Failed to load service packages:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách gói dịch vụ");
      setServicePackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (packageId: number | string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói dịch vụ "${name}"?`)) {
      return;
    }

    // Chỉ cho phép xóa nếu có ID hợp lệ (number)
    if (typeof packageId === 'string') {
      alert("Không thể xóa gói dịch vụ chưa có ID hợp lệ");
      return;
    }

    setDeletingId(packageId);
    try {
      await servicePackageAPI.delete(packageId);
      await loadData();
      alert("Xóa gói dịch vụ thành công!");
    } catch (err: any) {
      console.error("Failed to delete service package:", err);
      alert(err.response?.data?.message || "Không thể xóa gói dịch vụ");
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount && amount !== 0) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPackageId = (pkg: ServicePackageDTO, index: number): number | string => {
    return pkg.packageId || pkg.servicePackageId || `temp-${index}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-cyan-200/50 dark:border-cyan-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Danh sách gói dịch vụ
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý các gói dịch vụ bổ sung cho condotel của bạn
          </p>
        </div>
        <ButtonPrimary 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm gói dịch vụ
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
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-800"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : servicePackages.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-cyan-50/30 dark:from-neutral-800 dark:to-cyan-900/10 rounded-2xl shadow-xl border border-cyan-200/50 dark:border-cyan-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có gói dịch vụ nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Bắt đầu bằng cách tạo gói dịch vụ mới.
          </p>
          <ButtonPrimary 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm gói dịch vụ đầu tiên
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servicePackages.map((pkg, index) => {
            const packageId = getPackageId(pkg, index);
            return (
              <div
                key={packageId}
                className="bg-gradient-to-br from-white to-cyan-50/30 dark:from-neutral-800 dark:to-cyan-900/10 rounded-2xl shadow-xl p-6 border border-cyan-200/50 dark:border-cyan-800/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                      {pkg.name || pkg.title}
                    </h3>
                    {pkg.description && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md ${
                      pkg.isActive !== false
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                    }`}
                  >
                    {pkg.isActive !== false ? "Đang hoạt động" : "Đã tắt"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Giá:</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(pkg.price)}
                    </span>
                  </div>
                  {pkg.duration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">Thời hạn:</span>
                      <span className="text-neutral-900 dark:text-neutral-100">
                        {pkg.duration} {pkg.durationUnit === "month" ? "tháng" : pkg.durationUnit === "year" ? "năm" : "ngày"}
                      </span>
                    </div>
                  )}
                  {pkg.features && pkg.features.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                        Tính năng:
                      </p>
                      <ul className="space-y-1">
                        {pkg.features.slice(0, 3).map((feature, featureIndex) => (
                          <li key={`${packageId}-feature-${featureIndex}`} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start">
                            <svg
                              className="w-4 h-4 text-green-500 mr-1 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{feature}</span>
                          </li>
                        ))}
                        {pkg.features.length > 3 && (
                          <li className="text-xs text-neutral-500 dark:text-neutral-400">
                            + {pkg.features.length - 3} tính năng khác
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t border-cyan-200 dark:border-cyan-800">
                  <ButtonSecondary
                    onClick={() => setEditingPackage(pkg)}
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
                    onClick={() => {
                      if (typeof packageId === 'number') {
                        handleDelete(packageId, pkg.name || pkg.title || "");
                      }
                    }}
                    disabled={deletingId === packageId || typeof packageId === 'string'}
                    className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title={typeof packageId === 'string' ? 'Không thể xóa gói dịch vụ chưa có ID hợp lệ' : undefined}
                  >
                    {deletingId === packageId ? (
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
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingPackage) && (
        <ServicePackageModal
          servicePackage={editingPackage}
          onClose={() => {
            setShowAddModal(false);
            setEditingPackage(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingPackage(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// ServicePackage Modal Component
interface ServicePackageModalProps {
  servicePackage?: ServicePackageDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ServicePackageModal: React.FC<ServicePackageModalProps> = ({
  servicePackage,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: servicePackage?.name || servicePackage?.title || "",
    description: servicePackage?.description || "",
    price: servicePackage?.price || 0,
    isActive: servicePackage?.isActive !== undefined ? servicePackage.isActive : (servicePackage?.status === "Active"),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update formData when servicePackage changes
  useEffect(() => {
    if (servicePackage) {
      console.log("📦 Loading servicePackage into form:", servicePackage);
      console.log("📦 Package ID:", servicePackage.packageId || servicePackage.servicePackageId);
      setFormData({
        name: servicePackage.name || servicePackage.title || "",
        description: servicePackage.description || "",
        price: servicePackage.price || 0,
        isActive: servicePackage.isActive !== undefined ? servicePackage.isActive : (servicePackage.status === "Active"),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        isActive: true,
      });
    }
  }, [servicePackage]);

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
      setError("Vui lòng nhập tên gói dịch vụ!");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setError("Vui lòng nhập giá hợp lệ!");
      return;
    }

    setLoading(true);
    try {
      // Chỉ gửi các trường mà backend hỗ trợ (name, description, price, status)
      const packageData: CreateServicePackageDTO | UpdateServicePackageDTO = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        price: formData.price,
        // Map isActive sang status khi update
        ...(servicePackage ? { status: formData.isActive ? "Active" : "Inactive" } : {}),
      };

      if (servicePackage) {
        // Update service package
        // Thử nhiều cách để lấy ID
        const packageId = servicePackage.packageId 
          || servicePackage.servicePackageId 
          || (servicePackage as any).serviceId
          || (servicePackage as any).id
          || (servicePackage as any).Id;
        
        console.log("🔍 Debug - ServicePackage object:", servicePackage);
        console.log("🔍 Debug - PackageId:", packageId);
        
        if (!packageId || packageId <= 0 || isNaN(Number(packageId))) {
          console.error("❌ Invalid package ID:", packageId, "from servicePackage:", servicePackage);
          setError("Không tìm thấy ID gói dịch vụ để cập nhật. Vui lòng tải lại trang và thử lại.");
          setLoading(false);
          return;
        }
        
        await servicePackageAPI.update(Number(packageId), packageData);
        alert("Cập nhật gói dịch vụ thành công!");
      } else {
        // Create service package
        await servicePackageAPI.create(packageData as CreateServicePackageDTO);
        alert("Tạo gói dịch vụ thành công!");
      }
      onSuccess();
    } catch (err: any) {
      console.error("Failed to save service package:", err);
      let errorMessage = "Không thể lưu gói dịch vụ. Vui lòng thử lại!";

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
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              {servicePackage ? "Sửa Gói dịch vụ" : "Thêm Gói dịch vụ mới"}
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
                  Tên gói dịch vụ *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                  placeholder="VD: Gói cơ bản, Gói premium..."
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
                  placeholder="Mô tả về gói dịch vụ..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Giá (VNĐ) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                  placeholder="Nhập giá dịch vụ"
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
                  {loading ? "Đang lưu..." : servicePackage ? "Cập nhật" : "Tạo mới"}
                </ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostServicePackageContent;






