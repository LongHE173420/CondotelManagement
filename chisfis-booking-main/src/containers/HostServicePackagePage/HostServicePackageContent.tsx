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

  const handleDelete = async (packageId: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói dịch vụ "${name}"?`)) {
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

  const getPackageId = (pkg: ServicePackageDTO): number => {
    return pkg.packageId || pkg.servicePackageId || 0;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Danh sách gói dịch vụ</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Quản lý các gói dịch vụ của bạn
          </p>
        </div>
        <ButtonPrimary onClick={() => setShowAddModal(true)}>
          + Thêm gói dịch vụ
        </ButtonPrimary>
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
      ) : servicePackages.length === 0 ? (
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Chưa có gói dịch vụ nào
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Bắt đầu bằng cách tạo gói dịch vụ mới.
          </p>
          <div className="mt-6">
            <ButtonPrimary onClick={() => setShowAddModal(true)}>
              + Thêm gói dịch vụ đầu tiên
            </ButtonPrimary>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servicePackages.map((pkg) => {
            const packageId = getPackageId(pkg);
            return (
              <div
                key={packageId}
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {pkg.name || pkg.title}
                    </h3>
                    {pkg.description && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pkg.isActive !== false
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
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
                        {pkg.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start">
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

                <div className="flex items-center space-x-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <ButtonSecondary
                    onClick={() => setEditingPackage(pkg)}
                    className="flex-1"
                  >
                    Sửa
                  </ButtonSecondary>
                  <button
                    onClick={() => handleDelete(packageId, pkg.name || pkg.title || "")}
                    disabled={deletingId === packageId}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {deletingId === packageId ? "Đang xóa..." : "Xóa"}
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
    duration: servicePackage?.duration || undefined,
    durationUnit: servicePackage?.durationUnit || "month",
    features: servicePackage?.features?.join("\n") || "",
    isActive: servicePackage?.isActive !== undefined ? servicePackage.isActive : true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      // Parse features from textarea (one per line)
      const featuresList = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const packageData: CreateServicePackageDTO | UpdateServicePackageDTO = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        price: formData.price,
        duration: formData.duration,
        durationUnit: formData.durationUnit,
        features: featuresList.length > 0 ? featuresList : undefined,
        isActive: formData.isActive,
      };

      if (servicePackage) {
        // Update service package
        const packageId = servicePackage.packageId || servicePackage.servicePackageId || 0;
        await servicePackageAPI.update(packageId, packageData);
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {servicePackage ? "Sửa Gói dịch vụ" : "Thêm Gói dịch vụ mới"}
            </h3>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Giá (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Thời hạn
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Đơn vị thời hạn
                </label>
                <select
                  value={formData.durationUnit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, durationUnit: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                >
                  <option value="day">Ngày</option>
                  <option value="month">Tháng</option>
                  <option value="year">Năm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tính năng (mỗi dòng một tính năng)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, features: e.target.value }))
                  }
                  rows={5}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="Tính năng 1&#10;Tính năng 2&#10;Tính năng 3"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Mỗi tính năng trên một dòng
                </p>
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

