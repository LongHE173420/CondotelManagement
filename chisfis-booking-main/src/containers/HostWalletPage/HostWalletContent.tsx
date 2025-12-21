import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import walletAPI, { WalletDTO, WalletCreateDTO, WalletUpdateDTO } from "api/wallet";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { toastSuccess, toastError } from "utils/toast";
import ConfirmModal from "components/ConfirmModal";

const HostWalletContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletDTO | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingWalletId, setDeletingWalletId] = useState<number | null>(null);
  const [deletingBankName, setDeletingBankName] = useState<string>("");

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
    setSuccess("");
    try {
      const walletsData = await walletAPI.getAll();
      setWallets(walletsData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách tài khoản ngân hàng");
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (walletId: number, bankName: string) => {
    setDeletingWalletId(walletId);
    setDeletingBankName(bankName);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingWalletId) return;
    setShowConfirmModal(false);
    setDeletingId(deletingWalletId);
    try {
      await walletAPI.delete(deletingWalletId);
      toastSuccess("✅ Xóa tài khoản ngân hàng thành công!");
      await loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "❌ Không thể xóa tài khoản ngân hàng";
      toastError(errorMsg);
    } finally {
      setDeletingId(null);
      setDeletingWalletId(null);
      setDeletingBankName("");
    }
  };

  const handleSetDefault = async (walletId: number) => {
    setSettingDefaultId(walletId);
    setError("");
    setSuccess("");
    try {
      const result = await walletAPI.setDefault(walletId);
      if (result.success) {
        const successMsg = result.message || "✅ Đã đặt tài khoản làm mặc định thành công!";
        setSuccess(successMsg);
        toastSuccess(successMsg);
        await loadData();
      } else {
        const errorMsg = result.message || "❌ Không thể đặt tài khoản làm mặc định";
        setError(errorMsg);
        toastError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "❌ Không thể đặt tài khoản làm mặc định";
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setSettingDefaultId(null);
    }
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
            Quản lý Tài khoản Ngân hàng
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý các tài khoản ngân hàng để nhận thanh toán từ hệ thống
          </p>
        </div>
        <ButtonPrimary 
          onClick={() => {
            setEditingWallet(null);
            setShowAddModal(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm Tài khoản
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

      {wallets.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-900/10 rounded-2xl shadow-xl border border-emerald-200/50 dark:border-emerald-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có tài khoản ngân hàng nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Thêm tài khoản ngân hàng để nhận thanh toán từ hệ thống.
          </p>
          <ButtonPrimary 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm tài khoản đầu tiên
            </span>
          </ButtonPrimary>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.walletId}
              className={`bg-gradient-to-br from-white to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-900/10 rounded-2xl shadow-xl p-6 border-2 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                wallet.isDefault
                  ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-800"
                  : "border-emerald-200/50 dark:border-emerald-800/50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {wallet.bankName?.charAt(0)?.toUpperCase() || "B"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {wallet.bankName}
                      </h3>
                      {wallet.bankCode && (
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          Mã: {wallet.bankCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {wallet.isDefault && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md">
                    Mặc định
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Số tài khoản:</span>
                  <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                    {wallet.accountNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Chủ tài khoản:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {wallet.accountHolderName}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                {!wallet.isDefault && (
                  <button
                    onClick={() => handleSetDefault(wallet.walletId)}
                    disabled={settingDefaultId === wallet.walletId}
                    className="flex-1 px-3 py-2 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {settingDefaultId === wallet.walletId ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Đặt mặc định
                      </>
                    )}
                  </button>
                )}
                <ButtonSecondary
                  onClick={() => {
                    setEditingWallet(wallet);
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
                  onClick={() => handleDelete(wallet.walletId, wallet.bankName)}
                  disabled={deletingId === wallet.walletId || wallet.isDefault}
                  className="px-3 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title={wallet.isDefault ? "Không thể xóa tài khoản mặc định" : "Xóa"}
                >
                  {deletingId === wallet.walletId ? (
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
      {showAddModal && (
        <WalletModal
          wallet={editingWallet}
          onClose={() => {
            setShowAddModal(false);
            setEditingWallet(null);
            setError("");
            setSuccess("");
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingWallet(null);
            setError("");
            setSuccess("");
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Wallet Modal Component
interface WalletModalProps {
  wallet?: WalletDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ wallet, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<WalletCreateDTO>({
    bankName: wallet?.bankName || "",
    bankCode: wallet?.bankCode || "",
    accountNumber: wallet?.accountNumber || "",
    accountHolderName: wallet?.accountHolderName || "",
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

  // Danh sách ngân hàng phổ biến ở Việt Nam
  const commonBanks = [
    { name: "Vietcombank", code: "VCB" },
    { name: "Vietinbank", code: "CTG" },
    { name: "BIDV", code: "BID" },
    { name: "Agribank", code: "VBA" },
    { name: "Techcombank", code: "TCB" },
    { name: "MBBank", code: "MB" },
    { name: "ACB", code: "ACB" },
    { name: "VPBank", code: "VPB" },
    { name: "TPBank", code: "TPB" },
    { name: "Sacombank", code: "STB" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.bankName || !formData.bankName.trim()) {
      setError("Vui lòng nhập tên ngân hàng!");
      return;
    }
    if (!formData.accountNumber || !formData.accountNumber.trim()) {
      setError("Vui lòng nhập số tài khoản!");
      return;
    }
    if (!formData.accountHolderName || !formData.accountHolderName.trim()) {
      setError("Vui lòng nhập tên chủ tài khoản!");
      return;
    }

    setLoading(true);
    try {
      if (wallet) {
        // Update wallet
        const updateDto: WalletUpdateDTO = {
          bankName: formData.bankName.trim(),
          bankCode: formData.bankCode?.trim() || undefined,
          accountNumber: formData.accountNumber.trim(),
          accountHolderName: formData.accountHolderName.trim(),
        };
        await walletAPI.update(wallet.walletId, updateDto);
        toastSuccess("✅ Cập nhật tài khoản ngân hàng thành công!");
      } else {
        // Create wallet
        await walletAPI.create({
          bankName: formData.bankName.trim(),
          bankCode: formData.bankCode?.trim() || undefined,
          accountNumber: formData.accountNumber.trim(),
          accountHolderName: formData.accountHolderName.trim(),
        });
        toastSuccess("✅ Tạo tài khoản ngân hàng thành công!");
      }
      // Delay slightly to show success message before closing
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      let errorMessage = "❌ Không thể lưu tài khoản ngân hàng. Vui lòng thử lại!";

      if (err.response?.data?.message) {
        errorMessage = `❌ ${err.response.data.message}`;
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
      toastError(errorMessage);
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
            {wallet ? "Sửa Tài khoản Ngân hàng" : "Thêm Tài khoản Ngân hàng mới"}
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
                  Tên ngân hàng *
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => {
                    const selectedBank = commonBanks.find(b => b.name === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      bankName: e.target.value,
                      bankCode: selectedBank?.code || prev.bankCode,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100 mb-2"
                >
                  <option value="">-- Chọn ngân hàng phổ biến --</option>
                  {commonBanks.map((bank) => (
                    <option key={bank.code} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Hoặc nhập tên ngân hàng khác"
                  value={formData.bankName}
                  onChange={(e) => {
                    const selectedBank = commonBanks.find(b => b.name === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      bankName: e.target.value,
                      bankCode: selectedBank?.code || prev.bankCode,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Mã ngân hàng (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.bankCode || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bankCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="VD: VCB, TCB, MB..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Số tài khoản *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, "") }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100 font-mono"
                  required
                  placeholder="Nhập số tài khoản"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên chủ tài khoản *
                </label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountHolderName: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  required
                  placeholder="Nhập tên chủ tài khoản"
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
                  {loading ? "Đang lưu..." : wallet ? "Cập nhật" : "Tạo mới"}
                </ButtonPrimary>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default HostWalletContent;

