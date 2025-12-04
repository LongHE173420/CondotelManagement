import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import walletAPI, { WalletDTO, WalletCreateDTO, WalletUpdateDTO } from "api/wallet";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";

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
      console.error("Failed to load wallets:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách tài khoản ngân hàng");
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (walletId: number, bankName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ngân hàng "${bankName}"?`)) {
      return;
    }

    setDeletingId(walletId);
    try {
      await walletAPI.delete(walletId);
      setSuccess("Xóa tài khoản ngân hàng thành công!");
      await loadData();
    } catch (err: any) {
      console.error("Failed to delete wallet:", err);
      setError(err.response?.data?.message || "Không thể xóa tài khoản ngân hàng");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (walletId: number) => {
    setSettingDefaultId(walletId);
    try {
      await walletAPI.setDefault(walletId);
      setSuccess("Đã đặt tài khoản làm mặc định!");
      await loadData();
    } catch (err: any) {
      console.error("Failed to set default wallet:", err);
      setError(err.response?.data?.message || "Không thể đặt tài khoản làm mặc định");
    } finally {
      setSettingDefaultId(null);
    }
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
          <h2 className="text-2xl font-bold">Quản lý Tài khoản Ngân hàng</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Quản lý các tài khoản ngân hàng để nhận thanh toán từ hệ thống
          </p>
        </div>
        <ButtonPrimary onClick={() => {
          setEditingWallet(null);
          setShowAddModal(true);
        }}>
          + Thêm Tài khoản
        </ButtonPrimary>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => setError("")}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Đóng
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          <button
            onClick={() => setSuccess("")}
            className="mt-2 text-sm text-green-600 underline hover:text-green-800"
          >
            Đóng
          </button>
        </div>
      )}

      {wallets.length === 0 ? (
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
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Chưa có tài khoản ngân hàng nào
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Thêm tài khoản ngân hàng để nhận thanh toán từ hệ thống.
          </p>
          <div className="mt-6">
            <ButtonPrimary onClick={() => setShowAddModal(true)}>
              + Thêm tài khoản đầu tiên
            </ButtonPrimary>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.walletId}
              className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 ${
                wallet.isDefault
                  ? "border-primary-500 dark:border-primary-400"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {wallet.bankName}
                  </h3>
                  {wallet.bankCode && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Mã: {wallet.bankCode}
                    </p>
                  )}
                </div>
                {wallet.isDefault && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
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

              <div className="flex items-center space-x-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                {!wallet.isDefault && (
                  <button
                    onClick={() => handleSetDefault(wallet.walletId)}
                    disabled={settingDefaultId === wallet.walletId}
                    className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-800 disabled:text-gray-400 disabled:cursor-not-allowed border border-primary-300 rounded-md hover:bg-primary-50 transition-colors"
                  >
                    {settingDefaultId === wallet.walletId ? "Đang xử lý..." : "Đặt mặc định"}
                  </button>
                )}
                <ButtonSecondary
                  onClick={() => {
                    setEditingWallet(wallet);
                    setShowAddModal(true);
                  }}
                  className="flex-1"
                >
                  Sửa
                </ButtonSecondary>
                <button
                  onClick={() => handleDelete(wallet.walletId, wallet.bankName)}
                  disabled={deletingId === wallet.walletId || wallet.isDefault}
                  className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  title={wallet.isDefault ? "Không thể xóa tài khoản mặc định" : "Xóa"}
                >
                  {deletingId === wallet.walletId ? "Đang xóa..." : "Xóa"}
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
        alert("Cập nhật tài khoản ngân hàng thành công!");
      } else {
        // Create wallet
        await walletAPI.create({
          bankName: formData.bankName.trim(),
          bankCode: formData.bankCode?.trim() || undefined,
          accountNumber: formData.accountNumber.trim(),
          accountHolderName: formData.accountHolderName.trim(),
        });
        alert("Tạo tài khoản ngân hàng thành công!");
      }
      onSuccess();
    } catch (err: any) {
      console.error("Failed to save wallet:", err);
      let errorMessage = "Không thể lưu tài khoản ngân hàng. Vui lòng thử lại!";

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
              {wallet ? "Sửa Tài khoản Ngân hàng" : "Thêm Tài khoản Ngân hàng mới"}
            </h3>

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
    </div>
  );
};

export default HostWalletContent;

