import React, { useState, useEffect } from "react";
import utilityAPI, { UtilityDTO, UtilityCreateUpdateDTO } from "api/utility";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";

const PageAdminUtilities: React.FC = () => {
  const [utilities, setUtilities] = useState<UtilityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUtility, setEditingUtility] = useState<UtilityDTO | null>(null);
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
    loadUtilities();
  }, []);

  const loadUtilities = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await utilityAPI.getAllAdmin();
      setUtilities(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách utilities");
      setUtilities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Utility",
      message: `Bạn có chắc chắn muốn xóa utility "${name}"?`,
      action: async () => {
        setDeletingId(id);
        try {
          await utilityAPI.deleteAdmin(id);
          setSuccess(`Đã xóa utility "${name}" thành công!`);
          await loadUtilities();
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        } catch (err: any) {
          setError(err.response?.data?.message || "Không thể xóa utility. Có thể utility đang được sử dụng bởi một số condotel.");
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-200 dark:border-rose-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-rose-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-rose-200/50 dark:border-rose-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Quản lý Utilities
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
          </p>
        </div>
        <ButtonPrimary 
          onClick={() => {
            setEditingUtility(null);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm Utility
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

      {utilities.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-rose-50/30 dark:from-neutral-800 dark:to-rose-900/10 rounded-2xl shadow-xl border border-rose-200/50 dark:border-rose-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có utility nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Bắt đầu bằng cách tạo utility mới cho hệ thống.
          </p>
          <ButtonPrimary 
            onClick={() => {
              setEditingUtility(null);
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm utility đầu tiên
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {utilities.map((utility) => (
            <div
              key={utility.utilityId}
              className="bg-gradient-to-br from-white to-rose-50/30 dark:from-neutral-800 dark:to-rose-900/10 rounded-2xl shadow-xl p-6 border border-rose-200/50 dark:border-rose-800/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                    {utility.name}
                  </h3>
                  {utility.hostId !== undefined && (
                    <div className="flex items-center text-sm mb-2">
                      {utility.hostId === 0 ? (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                          System Utility
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                          Host #{utility.hostId}
                        </span>
                      )}
                    </div>
                  )}
                  {utility.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {utility.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-rose-200 dark:border-rose-800">
                <ButtonSecondary
                  onClick={() => {
                    setEditingUtility(utility);
                    setShowModal(true);
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
                  onClick={() => handleDelete(utility.utilityId, utility.name)}
                  disabled={deletingId === utility.utilityId}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingId === utility.utilityId ? (
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
      {showModal && (
        <UtilityModal
          utility={editingUtility}
          onClose={() => {
            setShowModal(false);
            setEditingUtility(null);
            setError("");
            setSuccess("");
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingUtility(null);
            setError("");
            setSuccess("");
            loadUtilities();
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

// Utility Modal Component
interface UtilityModalProps {
  utility?: UtilityDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UtilityModal: React.FC<UtilityModalProps> = ({ utility, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<UtilityCreateUpdateDTO>({
    name: utility?.name || "",
    description: utility?.description || "",
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

    // Validation
    if (!formData.name || !formData.name.trim()) {
      setError("Vui lòng nhập tên utility!");
      return;
    }

    setLoading(true);
    try {
      if (utility) {
        // Update utility
        await utilityAPI.updateAdmin(utility.utilityId, {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
        });
        alert("Cập nhật utility thành công!");
      } else {
        // Create utility
        await utilityAPI.createAdmin({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
        });
        alert("Tạo utility thành công!");
      }
      onSuccess();
    } catch (err: any) {
      let errorMessage = "Không thể lưu utility. Vui lòng thử lại!";

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
          <h3 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            {utility ? "Sửa Utility" : "Thêm Utility mới"}
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
                  Tên utility *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                  placeholder="VD: WiFi, Điều hòa, TV, Tủ lạnh..."
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
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="Mô tả về utility..."
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
                  {loading ? "Đang lưu..." : utility ? "Cập nhật" : "Tạo mới"}
                </ButtonPrimary>
              </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PageAdminUtilities;


