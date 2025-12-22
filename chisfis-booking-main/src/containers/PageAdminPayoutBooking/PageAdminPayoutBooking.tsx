import React, { useState, useEffect } from "react";
import payoutAPI, { HostPayoutDTO } from "api/payout";
import { adminAPI, AdminUserDTO } from "api/admin";
import paymentAPI from "api/payment";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import moment from "moment";
import { toastError, toastSuccess, toastWarning } from "utils/toast";
import ConfirmModal from "components/ConfirmModal";

interface HostOption {
  hostId: number;
  fullName: string;
  email: string;
}

type PayoutTab = "pending" | "paid" | "rejected";

const PageAdminPayoutBooking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PayoutTab>("pending");
  const [pendingPayouts, setPendingPayouts] = useState<HostPayoutDTO[]>([]);
  const [paidPayouts, setPaidPayouts] = useState<HostPayoutDTO[]>([]);
  const [rejectedPayouts, setRejectedPayouts] = useState<HostPayoutDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingAll, setProcessingAll] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterHostId, setFilterHostId] = useState<number | undefined>(undefined);
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [hosts, setHosts] = useState<HostOption[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<HostPayoutDTO | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [loadingQR, setLoadingQR] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProcessAllModal, setShowProcessAllModal] = useState(false);

  const loadPendingPayouts = async () => {
    setLoading(true);
    setError("");
    try {
      // Admin API - xem tất cả booking chờ thanh toán (có thể filter theo hostId)
      const data = await payoutAPI.getAdminPendingPayouts(filterHostId);
      setPendingPayouts(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tải danh sách booking chờ thanh toán";
      setError(errorMsg);
      toastError(errorMsg);
      setPendingPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPaidPayouts = async () => {
    setLoading(true);
    setError("");
    try {
      // Admin API - xem tất cả booking đã thanh toán (có thể filter theo hostId, fromDate, toDate)
      const data = await payoutAPI.getAdminPaidPayouts({
        hostId: filterHostId,
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
      });
      setPaidPayouts(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tải danh sách booking đã thanh toán";
      setError(errorMsg);
      toastError(errorMsg);
      setPaidPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRejectedPayouts = async () => {
    setLoading(true);
    setError("");
    try {
      // Admin API - xem tất cả booking đã bị từ chối (có thể filter theo hostId, fromDate, toDate)
      const data = await payoutAPI.getAdminRejectedPayouts({
        hostId: filterHostId,
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
      });
      setRejectedPayouts(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể tải danh sách booking đã bị từ chối";
      setError(errorMsg);
      toastError(errorMsg);
      setRejectedPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách hosts
  useEffect(() => {
    const loadHosts = async () => {
      setLoadingHosts(true);
      try {
        const users = await adminAPI.getAllUsers();
        // Filter chỉ lấy users có roleName là "Host"
        const hostUsers = users
          .filter((user: AdminUserDTO) => user.roleName === "Host")
          .map((user: AdminUserDTO) => ({
            hostId: user.userId,
            fullName: user.fullName,
            email: user.email || "",
          }));
        setHosts(hostUsers);
      } catch (err: any) {
        toastError("Không thể tải danh sách host");
      } finally {
        setLoadingHosts(false);
      }
    };
    loadHosts();
  }, []);

  useEffect(() => {
    if (activeTab === "pending") {
      loadPendingPayouts();
    } else if (activeTab === "paid") {
      loadPaidPayouts();
    } else if (activeTab === "rejected") {
      loadRejectedPayouts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterHostId, filterFromDate, filterToDate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showQRModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showQRModal]);

  const handleProcessPayout = async (payout: HostPayoutDTO) => {
    // Kiểm tra thông tin ngân hàng
    if (!payout.bankName || !payout.accountNumber || !payout.accountHolderName) {
      toastWarning("Thông tin ngân hàng của host chưa đầy đủ. Vui lòng yêu cầu host cập nhật thông tin ngân hàng trước khi thanh toán.");
      return;
    }

    // Lưu payout được chọn và hiển thị modal QR
    setSelectedPayout(payout);
    setShowQRModal(true);
    setQrUrl("");
    setError("");
    setSuccess("");

    // Tạo QR code
    await generateQRCode(payout);
  };

  const generateQRCode = async (payout: HostPayoutDTO) => {
    console.log("=== Generating QR Code ===");
    setLoadingQR(true);
    
    if (!payout.bankName || !payout.accountNumber || !payout.accountHolderName) {
      console.error("Missing bank info:", {
        bankName: payout.bankName,
        accountNumber: payout.accountNumber,
        accountHolderName: payout.accountHolderName
      });
      toastError("Thiếu thông tin ngân hàng để tạo QR code");
      setLoadingQR(false);
      return;
    }

    try {
      // Map bank name to bank code (có thể cần điều chỉnh theo backend)
      const bankCode = mapBankNameToCode(payout.bankName);
      const amount = payout.amount || payout.totalPrice || 0;
      const content = `Thanh toan booking #${payout.bookingId}`;
      const accountName = payout.accountHolderName;

      // Gọi backend API (đã sửa bin codes)
      const qrData = await paymentAPI.generateQR({
        bankCode: bankCode,
        accountNumber: payout.accountNumber,
        amount: amount,
        accountHolderName: accountName,
        content: content,
      });

      if (qrData.compactUrl || qrData.printUrl) {
        const url = qrData.compactUrl || qrData.printUrl || "";
        setQrUrl(url);
        toastSuccess("Tạo QR code thành công");
      } else {
        throw new Error("API không trả về URL QR code");
      }
      
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || "Không thể tạo QR code từ API");
      
      // Fallback: tạo URL trực tiếp nếu API fail - dùng bin code
      try {
        const binCode = mapBankNameToBinCode(payout.bankName);
        const amount = payout.amount || payout.totalPrice || 0;
        const content = `Thanh toan booking #${payout.bookingId}`;
        const accountName = payout.accountHolderName;

        // VietQR.io API v2 format - dùng bin code thay vì bank code
        const fallbackUrl = `https://img.vietqr.io/image/${binCode}-${payout.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
        setQrUrl(fallbackUrl);
        toastSuccess("Sử dụng QR code dự phòng");
      } catch (fallbackErr) {
        toastError("Không thể tạo QR code");
      }
    } finally {
      setLoadingQR(false);
    }
  };

  // Map bank name to bin code (sử dụng bin code chính thức cho VietQR API)
  const mapBankNameToBinCode = (bankName: string): string => {
    const bankMap: { [key: string]: string } = {
      "Vietcombank": "970436",
      "VCB": "970436",
      "Vietinbank": "970415",
      "CTG": "970415",
      "BIDV": "970418",
      "BID": "970418",
      "Agribank": "970405",
      "VBA": "970405",
      "Techcombank": "970407",
      "TCB": "970407",
      "MBBank": "970422",
      "MB": "970422",
      "ACB": "970416",
      "VPBank": "970432",
      "VPB": "970432",
      "TPBank": "970423",
      "TPB": "970423",
      "Sacombank": "970403",
      "STB": "970403",
      "HDBank": "970437",
      "HDB": "970437",
      "SHB": "970443",
      "VIB": "970441",
      "MSB": "970426",
    };

    // Tìm bin code từ tên ngân hàng
    for (const [name, binCode] of Object.entries(bankMap)) {
      if (bankName.toLowerCase().includes(name.toLowerCase())) {
        return binCode;
      }
    }

    // Default fallback
    return "970418"; // BIDV
  };

  // Map bank name to short code (để gửi cho backend)
  const mapBankNameToCode = (bankName: string): string => {
    const bankMap: { [key: string]: string } = {
      "Vietcombank": "VCB",
      "Vietinbank": "CTG",
      "BIDV": "BID",
      "Agribank": "VBA",
      "Techcombank": "TCB",
      "MBBank": "MB",
      "ACB": "ACB",
      "VPBank": "VPB",
      "TPBank": "TPB",
      "Sacombank": "STB",
      "HDBank": "HDB",
      "SHB": "SHB",
      "VIB": "VIB",
      "MSB": "MSB",
    };

    // Tìm bank code từ tên ngân hàng
    for (const [name, code] of Object.entries(bankMap)) {
      if (bankName.toLowerCase().includes(name.toLowerCase())) {
        return code;
      }
    }

    // Nếu không tìm thấy, thử lấy 3 ký tự đầu hoặc trả về tên gốc
    return bankName.substring(0, 3).toUpperCase();
  };

  const handleConfirmTransfer = async () => {
    if (!selectedPayout) return;
    setShowConfirmModal(true);
  };

  const confirmTransfer = async () => {
    if (!selectedPayout) return;
    setShowConfirmModal(false);

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      // Admin API - xác nhận và xử lý payout
      const result = await payoutAPI.confirmPayout(selectedPayout.bookingId);
      
      if (result.success) {
        const successMsg = result.message || `Đã xác nhận và xử lý thanh toán cho booking #${selectedPayout.bookingId} thành công`;
        setSuccess(successMsg);
        toastSuccess(successMsg);
        // Đóng modal và reload danh sách
        setShowQRModal(false);
        setSelectedPayout(null);
        setQrUrl("");
        await loadPendingPayouts();
      } else {
        const errorMsg = result.message || "Không thể xử lý thanh toán";
        setError(errorMsg);
        toastError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể xử lý thanh toán";
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayout = async () => {
    if (!selectedPayout || !rejectReason.trim()) {
      setError("Vui lòng nhập lý do từ chối.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const result = await payoutAPI.rejectPayout(selectedPayout.bookingId, rejectReason.trim());
      
      if (result.success) {
        const successMsg = result.message || `Đã từ chối thanh toán cho booking #${selectedPayout.bookingId} thành công`;
        setSuccess(successMsg);
        toastSuccess(successMsg);
        setRejectModalOpen(false);
        setSelectedPayout(null);
        setRejectReason("");
        await loadPendingPayouts();
      } else {
        const errorMsg = result.message || "Không thể từ chối thanh toán";
        setError(errorMsg);
        toastError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể từ chối thanh toán";
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    setShowProcessAllModal(true);
  };

  const confirmProcessAll = async () => {
    setShowProcessAllModal(false);

    setProcessingAll(true);
    setError("");
    setSuccess("");

    try {
      // Admin API - xử lý tất cả booking đủ điều kiện
      const result = await payoutAPI.processAllPayouts();
      
      if (result.success) {
        const successMsg = result.message || 
          `Đã xử lý ${result.processedCount || result.processedBookings || 0} booking với tổng tiền ${result.totalAmount?.toLocaleString("vi-VN") || 0} đ`;
        setSuccess(successMsg);
        toastSuccess(successMsg);
        // Reload danh sách
        await loadPendingPayouts();
      } else {
        const errorMsg = result.message || "Không thể xử lý thanh toán";
        setError(errorMsg);
        toastError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể xử lý thanh toán";
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setProcessingAll(false);
    }
  };

  // Format số tiền
  const formatPrice = (price: number | undefined): string => {
    if (!price) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format ngày tháng
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      return moment(dateString).format("DD/MM/YYYY");
    } catch {
      return dateString;
    }
  };

  // Format ngày giờ
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      return moment(dateString).format("DD/MM/YYYY HH:mm");
    } catch {
      return dateString;
    }
  };

  // Toggle expand row
  const toggleExpand = (bookingId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedRows(newExpanded);
  };

  // Get current payouts based on active tab
  const currentPayouts = 
    activeTab === "pending" ? pendingPayouts : 
    activeTab === "paid" ? paidPayouts : 
    rejectedPayouts;
  const totalAmount = currentPayouts.reduce((sum, payout) => sum + (payout.amount || payout.totalPrice || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Quản lý thanh toán cho Host
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {activeTab === "pending" 
            ? "Xử lý thanh toán cho các booking đã hoàn thành và đủ 15 ngày kể từ ngày kết thúc"
            : activeTab === "paid"
            ? "Xem lịch sử các booking đã được thanh toán cho host"
            : "Xem danh sách các booking đã bị từ chối thanh toán"}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-indigo-200/50 dark:border-indigo-800/50 overflow-hidden">
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === "pending"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
          >
            Chờ thanh toán ({pendingPayouts.length})
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === "paid"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
          >
            Đã thanh toán ({paidPayouts.length})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === "rejected"
                ? "bg-gradient-to-r from-red-500 to-orange-600 text-white"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
          >
            Đã từ chối ({rejectedPayouts.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-6 border border-indigo-200/50 dark:border-indigo-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Host Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Lọc theo Host:
            </label>
            {loadingHosts ? (
              <div className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-50 dark:bg-neutral-700">
                <span className="text-sm text-neutral-500">Đang tải...</span>
              </div>
            ) : (
              <select
                value={filterHostId || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterHostId(value ? parseInt(value) : undefined);
                }}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              >
                <option value="">-- Tất cả Host --</option>
                {hosts.map((host) => (
                  <option key={host.hostId} value={host.hostId}>
                    {host.fullName} {host.email ? `(${host.email})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Filters - Show for Paid and Rejected tabs */}
          {(activeTab === "paid" || activeTab === "rejected") && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>
            </>
          )}

          {/* Clear Filters Button */}
          <div className="flex items-end">
            {(filterHostId || filterFromDate || filterToDate) && (
              <button
                onClick={() => {
                  setFilterHostId(undefined);
                  setFilterFromDate("");
                  setFilterToDate("");
                }}
                className="w-full px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-neutral-800 dark:to-indigo-900/10 rounded-2xl shadow-xl p-6 mb-6 border border-indigo-200/50 dark:border-indigo-800/50">
        <div className="flex items-center justify-between">
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 flex-1 mr-4">
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {activeTab === "pending" 
                ? "Tổng tiền chờ thanh toán" 
                : activeTab === "paid"
                ? "Tổng tiền đã thanh toán"
                : "Tổng tiền đã từ chối"}
            </p>
            <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
              {formatPrice(totalAmount)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 flex-1 mr-4 text-right">
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
              {activeTab === "pending" 
                ? "Số booking chờ thanh toán" 
                : activeTab === "paid"
                ? "Số booking đã thanh toán"
                : "Số booking đã từ chối"}
            </p>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
              {currentPayouts.length}
            </p>
          </div>
          {activeTab === "pending" && (
            <div className="text-right">
              <ButtonPrimary
                onClick={handleProcessAll}
                disabled={processingAll || pendingPayouts.length === 0}
                className="min-w-[200px]"
              >
                {processingAll ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  "Xử lý tất cả"
                )}
              </ButtonPrimary>
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
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

      {/* Payouts Table */}
      {currentPayouts.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-indigo-50/30 dark:from-neutral-800 dark:to-indigo-900/10 rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {activeTab === "pending" 
              ? "Không có booking chờ thanh toán"
              : activeTab === "paid"
              ? "Không có booking đã thanh toán"
              : "Không có booking đã từ chối"}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {activeTab === "pending"
              ? "Tất cả booking đã hoàn thành đã được thanh toán hoặc chưa đủ 15 ngày kể từ ngày kết thúc."
              : activeTab === "paid"
              ? "Không có booking nào đã được thanh toán trong khoảng thời gian đã chọn."
              : "Không có booking nào đã bị từ chối trong khoảng thời gian đã chọn."}
          </p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-neutral-700 dark:to-neutral-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 w-12"></th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Căn hộ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Ngày hoàn thành
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    {activeTab === "rejected" ? "Ngày từ chối" : "Số ngày chờ"}
                  </th>
                  {activeTab === "rejected" && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                      Lý do từ chối
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {currentPayouts.map((payout) => {
                  const isExpanded = expandedRows.has(payout.bookingId);
                  return (
                    <React.Fragment key={payout.bookingId}>
                      <tr className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-neutral-700/50 dark:hover:to-neutral-800/50 transition-all duration-200">
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleExpand(payout.bookingId)}
                            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <svg
                              className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          #{payout.bookingId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {payout.hostName || `Host #${payout.hostId || 'N/A'}`}
                            </div>
                            {payout.hostId && (
                              <div className="text-xs text-neutral-400">ID: {payout.hostId}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {payout.condotelName || `Condotel #${payout.condotelId}`}
                          </div>
                          {payout.condotelId && (
                            <div className="text-xs text-neutral-400">ID: {payout.condotelId}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {payout.customerName || `Customer #${payout.customerId}`}
                            </div>
                            {payout.customerEmail && (
                              <div className="text-xs text-neutral-400">{payout.customerEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDate(payout.completedAt || payout.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatPrice(payout.amount || payout.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          {activeTab === "rejected" ? (
                            payout.rejectedAt ? (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                                {formatDateTime(payout.rejectedAt)}
                              </span>
                            ) : (
                              <span className="text-neutral-400 italic">N/A</span>
                            )
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium">
                              {payout.daysSinceCompleted !== undefined
                                ? `${payout.daysSinceCompleted} ngày`
                                : "Đang tính"}
                            </span>
                          )}
                        </td>
                        {activeTab === "rejected" && (
                          <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
                            <div className="truncate" title={payout.rejectReason || "Không có lý do"}>
                              {payout.rejectReason || (
                                <span className="text-neutral-400 italic">Không có lý do</span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {activeTab === "pending" ? (
                            <div className="flex gap-2">
                              <ButtonPrimary
                                onClick={() => handleProcessPayout(payout)}
                                disabled={processing}
                                className="min-w-[100px]"
                              >
                                Xử lý
                              </ButtonPrimary>
                              <button
                                onClick={() => {
                                  setSelectedPayout(payout);
                                  setRejectReason("");
                                  setRejectModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={processing}
                                title="Từ chối thanh toán"
                              >
                                ❌ Từ chối
                              </button>
                            </div>
                          ) : activeTab === "paid" ? (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                              Đã thanh toán
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                              Đã từ chối
                            </span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-neutral-700/30 dark:to-neutral-800/30">
                          <td colSpan={activeTab === "rejected" ? 10 : 9} className="px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* Thông tin Host */}
                              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-indigo-200 dark:border-indigo-800">
                                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  Thông tin Host
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Tên:</span>
                                    <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                      {payout.hostName || `Host #${payout.hostId || 'N/A'}`}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Host ID:</span>
                                    <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                      {payout.hostId || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Thông tin Ngân hàng */}
                              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-green-200 dark:border-green-800">
                                <h4 className="text-sm font-bold text-green-600 dark:text-green-400 mb-3 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v4a3 3 0 003 3z" />
                                  </svg>
                                  Thông tin Ngân hàng
                                </h4>
                                {payout.bankName && payout.accountNumber ? (
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="text-neutral-500 dark:text-neutral-400">Ngân hàng:</span>
                                      <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                        {payout.bankName}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-neutral-500 dark:text-neutral-400">Số tài khoản:</span>
                                      <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                                        {payout.accountNumber}
                                      </span>
                                    </div>
                                    {payout.accountHolderName && (
                                      <div>
                                        <span className="text-neutral-500 dark:text-neutral-400">Tên chủ TK:</span>
                                        <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                          {payout.accountHolderName}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm text-neutral-400 italic">
                                    Chưa có thông tin ngân hàng
                                  </div>
                                )}
                              </div>

                              {/* Thông tin Booking */}
                              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-purple-200 dark:border-purple-800">
                                <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-3 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  Thông tin Booking
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Booking ID:</span>
                                    <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                      #{payout.bookingId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Căn hộ:</span>
                                    <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                      {payout.condotelName || `Condotel #${payout.condotelId}`}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Ngày hoàn thành:</span>
                                    <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                      {formatDate(payout.completedAt || payout.endDate)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Số ngày chờ:</span>
                                    <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                      {payout.daysSinceCompleted !== undefined
                                        ? `${payout.daysSinceCompleted} ngày`
                                        : "Đang tính"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Thông tin Khách hàng */}
                              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Thông tin Khách hàng
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Tên:</span>
                                    <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                      {payout.customerName || `Customer #${payout.customerId}`}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Customer ID:</span>
                                    <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                      {payout.customerId || 'N/A'}
                                    </span>
                                  </div>
                                  {payout.customerEmail && (
                                    <div>
                                      <span className="text-neutral-500 dark:text-neutral-400">Email:</span>
                                      <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                        {payout.customerEmail}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Thông tin Thanh toán */}
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 shadow-lg border border-green-200 dark:border-green-800">
                                <h4 className="text-sm font-bold text-green-600 dark:text-green-400 mb-3 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Thông tin Thanh toán
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Số tiền:</span>
                                    <span className="ml-2 text-lg font-bold text-green-600 dark:text-green-400">
                                      {formatPrice(payout.amount || payout.totalPrice)}
                                    </span>
                                  </div>
                                  {payout.paidAt && (
                                    <div>
                                      <span className="text-neutral-500 dark:text-neutral-400">Đã thanh toán:</span>
                                      <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                        {formatDate(payout.paidAt)}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-neutral-500 dark:text-neutral-400">Trạng thái:</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                      payout.isPaid 
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                        : activeTab === "rejected"
                                        ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                                    }`}>
                                      {payout.isPaid ? 'Đã thanh toán' : activeTab === "rejected" ? 'Đã từ chối' : 'Chờ thanh toán'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Thông tin Từ chối - Chỉ hiển thị cho rejected tab */}
                              {activeTab === "rejected" && (payout.rejectedAt || payout.rejectReason) && (
                                <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 shadow-lg border border-red-200 dark:border-red-800">
                                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Thông tin Từ chối
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    {payout.rejectedAt && (
                                      <div>
                                        <span className="text-neutral-500 dark:text-neutral-400">Ngày giờ từ chối:</span>
                                        <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                                          {formatDateTime(payout.rejectedAt)}
                                        </span>
                                      </div>
                                    )}
                                    {payout.rejectReason && (
                                      <div>
                                        <span className="text-neutral-500 dark:text-neutral-400">Lý do từ chối:</span>
                                        <div className="mt-1 p-2 bg-white dark:bg-neutral-800 rounded-md border border-red-200 dark:border-red-800">
                                          <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                                            {payout.rejectReason}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedPayout && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ position: 'fixed', width: '100%', height: '100%' }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => {
                if (!processing) {
                  setShowQRModal(false);
                  setSelectedPayout(null);
                  setQrUrl("");
                }
              }}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    QR Code Chuyển Khoản
                  </h3>
                  <button
                    onClick={() => {
                      if (!processing) {
                        setShowQRModal(false);
                        setSelectedPayout(null);
                        setQrUrl("");
                      }
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                    disabled={processing}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 bg-white dark:bg-neutral-800 max-h-[80vh] overflow-y-auto">
                {/* Thông tin chuyển khoản */}
                <div className="mb-6 space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                    <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">Thông tin chuyển khoản</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Booking ID:</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">#{selectedPayout.bookingId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Số tiền:</span>
                        <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                          {formatPrice(selectedPayout.amount || selectedPayout.totalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Ngân hàng:</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedPayout.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Số tài khoản:</span>
                        <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{selectedPayout.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Tên chủ TK:</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedPayout.accountHolderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Host:</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedPayout.hostName || `Host #${selectedPayout.hostId}`}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 text-center">
                    Quét mã QR để chuyển khoản
                  </h4>
                  <div className="flex justify-center">
                    {loadingQR ? (
                      <div className="w-64 h-64 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">Đang tạo QR code...</p>
                        </div>
                      </div>
                    ) : qrUrl ? (
                      <div className="bg-white p-4 rounded-xl shadow-lg">
                        <img 
                          src={qrUrl} 
                          alt="QR Code" 
                          className="w-64 h-64 object-contain" 
                          onError={(e) => {
                            toastError("Không thể tải QR code");
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="text-center px-4">
                          <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Không thể tạo QR code</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Debug info */}
                  <div className="mt-2 text-xs text-center text-neutral-400">
                    Loading: {loadingQR ? "Yes" : "No"} | Has URL: {qrUrl ? "Yes" : "No"}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <ButtonSecondary
                    onClick={() => {
                      if (!processing) {
                        setShowQRModal(false);
                        setSelectedPayout(null);
                        setQrUrl("");
                      }
                    }}
                    disabled={processing}
                    className="flex-1"
                  >
                    Hủy
                  </ButtonSecondary>
                  <ButtonPrimary
                    onClick={handleConfirmTransfer}
                    disabled={processing || loadingQR}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : (
                      "Xác nhận đã chuyển khoản"
                    )}
                  </ButtonPrimary>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Thông tin về xử lý thanh toán
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Chỉ booking có status "Completed" mới được thanh toán</li>
                <li>Booking phải đủ 15 ngày kể từ ngày kết thúc (EndDate)</li>
                <li>Booking không có refund request đang pending/approved mới được thanh toán</li>
                <li>Khi xử lý, hệ thống sẽ đánh dấu IsPaidToHost = true và lưu thời gian thanh toán</li>
                <li>Có thể xử lý từng booking hoặc xử lý tất cả cùng lúc</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL TỪ CHỐI PAYOUT */}
      {rejectModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" style={{ position: 'fixed', width: '100%', height: '100%' }}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all animate-fadeIn">
            <h3 className="text-lg font-bold text-red-600 mb-4">
              ❌ Từ chối thanh toán cho Host
            </h3>
            <p className="text-gray-600 mb-4">
              Bạn có chắc chắn muốn từ chối thanh toán cho booking #{selectedPayout.bookingId}? Vui lòng nhập lý do từ chối.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Booking có vấn đề về chất lượng dịch vụ, Khách hàng khiếu nại..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 justify-end">
              <ButtonSecondary
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedPayout(null);
                  setRejectReason("");
                }}
                disabled={processing}
              >
                Hủy
              </ButtonSecondary>
              <button
                onClick={handleRejectPayout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processing || !rejectReason.trim()}
              >
                {processing ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN CHUYỂN KHOẢN */}
      {selectedPayout && (
        <ConfirmModal
          show={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmTransfer}
          title="Xác nhận đã chuyển khoản?"
          message={`Bạn có chắc chắn đã chuyển khoản số tiền ${formatPrice(selectedPayout.amount || selectedPayout.totalPrice)} cho host ${selectedPayout.hostName || `#${selectedPayout.hostId}`} cho booking #${selectedPayout.bookingId}?`}
          confirmText="Xác nhận"
          cancelText="Hủy"
          type="success"
          loading={processing}
        />
      )}
    </div>
  );
};


export default PageAdminPayoutBooking;


