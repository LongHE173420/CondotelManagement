import React, { useState, useEffect } from "react";
import adminAPI from "api/admin";
import paymentAPI from "api/payment";

// --- Định nghĩa kiểu dữ liệu từ backend ---
interface RefundRequest {
  id?: number; // ID của refund request (nếu có)
  bookingId: number; // Booking ID gốc
  bookingIdFormatted?: string; // Format: BOOK-001 (từ backend)
  customerName: string;
  customerEmail?: string;
  refundAmount: number;
  bankInfo?: {
    bankName: string; // Mã ngân hàng (MB, VCB, TCB, ACB...) - đã được map từ VietQR
    accountNumber: string;
    accountHolder: string;
  };
  status: "Pending" | "Completed" | "Refunded"; // Backend map: "Cancelled" → "Pending", "Refunded" → "Completed"
  cancelDate?: string;
  createdAt?: string;
  reason?: string;
}

// --- Component hiển thị Badge trạng thái ---
const RefundStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusLower = status?.toLowerCase();
  if (statusLower === "completed" || statusLower === "refunded") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
        ✅ Đã hoàn tiền
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
      ⏳ Chưa hoàn tiền
    </span>
  );
};

const PageAdminRefund = () => {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // STATE CHO BỘ LỌC
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState(""); 
  const [endDate, setEndDate] = useState("");

  // STATE CHO MODAL XÁC NHẬN
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [refundType, setRefundType] = useState<"auto" | "manual">("auto");
  const [refundReason, setRefundReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // STATE CHO MODAL QR
  const [selectedQR, setSelectedQR] = useState<{ url: string; title: string; amount: number; content: string } | null>(null);
  
  // STATE CHO QR CODE TRONG MODAL XÁC NHẬN THỦ CÔNG
  const [qrUrlModal, setQrUrlModal] = useState<string>("");
  const [loadingQRModal, setLoadingQRModal] = useState(false);

  // Fetch refund requests từ API
  useEffect(() => {
    loadRefundRequests();
  }, [filterStatus, startDate, endDate]);

  const loadRefundRequests = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params: any = {
        status: filterStatus === "all" ? undefined : filterStatus,
        searchTerm: searchTerm || undefined,
      };
      
      if (startDate) {
        params.startDate = new Date(startDate).toISOString();
      }
      if (endDate) {
        params.endDate = new Date(endDate + "T23:59:59").toISOString();
      }

      const response = await adminAPI.getRefundRequests(params);
      const data = response.data || [];
      
      console.log("📥 Raw refund requests from API:", data);
      if (data.length > 0) {
        console.log("📥 First item sample:", JSON.stringify(data[0], null, 2));
        console.log("📥 First item bankInfo:", data[0].bankInfo || data[0].BankInfo || "NOT FOUND");
      }
      
      // Normalize response từ backend (PascalCase -> camelCase)
      // Backend trả về RefundRequestDTO với format bookingId: BOOK-001
      const normalized = data.map((item: any, index: number) => {
        // Đảm bảo bookingId là number, không phải string format
        let bookingId: number;
        const rawBookingId = item.BookingId !== undefined ? item.BookingId : item.bookingId;
        
        if (typeof rawBookingId === 'number') {
          bookingId = rawBookingId;
        } else if (typeof rawBookingId === 'string') {
          // Nếu là string format "BOOK-033", extract số
          const match = rawBookingId.match(/\d+/);
          bookingId = match ? parseInt(match[0], 10) : 0;
        } else {
          bookingId = 0;
        }
        
        // Parse bankInfo với nhiều format khác nhau
        const parsedBankInfo = (() => {
          // 1. BankInfo object (PascalCase)
          if (item.BankInfo) {
            const bankInfo = {
              bankName: item.BankInfo.BankCode || item.BankInfo.bankCode || item.BankInfo.BankName || item.BankInfo.bankName || "",
              accountNumber: item.BankInfo.AccountNumber || item.BankInfo.accountNumber || "",
              accountHolder: item.BankInfo.AccountHolder || item.BankInfo.accountHolder || "",
            };
            if (bankInfo.bankName || bankInfo.accountNumber) {
              console.log(`✅ [${index}] Parsed BankInfo (PascalCase):`, bankInfo);
              return bankInfo;
            }
          }
          // 2. bankInfo object (camelCase) - format backend đang trả về
          if (item.bankInfo) {
            const bankInfo = {
              bankName: item.bankInfo.bankName || item.bankInfo.BankCode || item.bankInfo.bankCode || item.bankInfo.BankName || "",
              accountNumber: item.bankInfo.accountNumber || item.bankInfo.AccountNumber || "",
              accountHolder: item.bankInfo.accountHolder || item.bankInfo.AccountHolder || "",
            };
            if (bankInfo.bankName || bankInfo.accountNumber) {
              console.log(`✅ [${index}] Parsed bankInfo (camelCase):`, bankInfo);
              return bankInfo;
            }
          }
          // 3. Bank info ở root level (từ database trực tiếp)
          if (item.BankCode || item.bankCode) {
            const bankInfo = {
              bankName: item.BankCode || item.bankCode || "",
              accountNumber: item.AccountNumber || item.accountNumber || "",
              accountHolder: item.AccountHolder || item.accountHolder || "",
            };
            if (bankInfo.bankName || bankInfo.accountNumber) {
              console.log(`✅ [${index}] Parsed bankInfo (root level):`, bankInfo);
              return bankInfo;
            }
          }
          if (index === 0) {
            console.warn(`⚠️ [${index}] No bankInfo found in item:`, {
              hasBankInfo: !!item.BankInfo,
              hasbankInfo: !!item.bankInfo,
              hasBankCode: !!item.BankCode,
              hasbankCode: !!item.bankCode,
              itemKeys: Object.keys(item),
            });
          }
          return undefined;
        })();
        
        return {
        id: item.Id !== undefined ? item.Id : item.id,
        bookingId: bookingId,
        bookingIdFormatted: item.BookingIdFormatted || item.bookingIdFormatted || 
                           (bookingId ? `BOOK-${String(bookingId).padStart(3, '0')}` : undefined),
        customerName: item.CustomerName || item.customerName,
        customerEmail: item.CustomerEmail || item.customerEmail,
        refundAmount: item.RefundAmount !== undefined ? item.RefundAmount : item.refundAmount,
        bankInfo: parsedBankInfo,
        status: item.Status || item.status || "Pending", // Backend map: "Cancelled" → "Pending", "Refunded" → "Completed"
        cancelDate: (() => {
          const cancelDate = item.CancelDate || item.cancelDate || item.CancelDateFormatted || item.cancelDateFormatted;
          if (cancelDate && index === 0) {
            console.log("📅 CancelDate from backend:", cancelDate, typeof cancelDate);
          }
          return cancelDate;
        })(),
        createdAt: item.CreatedAt || item.createdAt,
        reason: item.Reason || item.reason,
      };
      });
      
      setRequests(normalized);
    } catch (err: any) {
      console.error("Error loading refund requests:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách yêu cầu hoàn tiền");
    } finally {
      setLoading(false);
    }
  };

  // Tìm kiếm với debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadRefundRequests();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Tự động generate QR code cho các request có bankInfo khi load xong
  useEffect(() => {
    if (requests.length > 0) {
      requests.forEach((req) => {
        if (req.status === "Pending" && req.bankInfo && !qrUrlsCache[req.bookingId] && !loadingQR[req.bookingId]) {
          generateQRUrl(req, "compact").catch(console.error);
        }
      });
    }
  }, [requests]);

  // --- HÀM MỞ MODAL XÁC NHẬN ---
  const openConfirmModal = async (bookingId: number, type: "auto" | "manual") => {
    // Đảm bảo bookingId là number, không phải string format
    let numericId: number;
    if (typeof bookingId === 'number') {
      numericId = bookingId;
    } else if (typeof bookingId === 'string') {
      numericId = parseInt(String(bookingId).replace(/BOOK-/gi, ''), 10);
    } else {
      numericId = bookingId as number;
    }
    
    console.log("🔍 Opening confirm modal with bookingId:", numericId, "type:", type);
    setSelectedBookingId(numericId);
    setRefundType(type);
    setRefundReason("");
    setConfirmModalOpen(true);
    
    // Nếu là manual refund, generate QR code ngay
    if (type === "manual") {
      const selectedRequest = requests.find(req => req.bookingId === numericId);
      if (selectedRequest?.bankInfo) {
        setLoadingQRModal(true);
        setQrUrlModal("");
        try {
          const url = await generateQRUrl(selectedRequest, "print");
          setQrUrlModal(url);
        } catch (error) {
          console.error("Error generating QR for modal:", error);
        } finally {
          setLoadingQRModal(false);
        }
      } else {
        setQrUrlModal("");
      }
    } else {
      // Reset QR URL khi mở modal auto
      setQrUrlModal("");
    }
  };

  // --- HÀM THỰC HIỆN HOÀN TIỀN TỰ ĐỘNG (Cas API) ---
  const handleAutoRefund = async () => {
    if (!selectedBookingId) return;

    // Đảm bảo bookingId là number
    let numericId: number;
    if (typeof selectedBookingId === 'number') {
      numericId = selectedBookingId;
    } else if (typeof selectedBookingId === 'string') {
      numericId = parseInt(String(selectedBookingId).replace(/BOOK-/gi, ''), 10);
    } else {
      numericId = selectedBookingId as number;
    }
    
    console.log("💰 Processing auto refund for bookingId:", numericId);

    setProcessing(true);
    try {
      const result = await adminAPI.refundBooking(numericId, refundReason || undefined);
      
      if (result.success) {
        alert(result.message || "Hoàn tiền tự động thành công!");
        setConfirmModalOpen(false);
        setSelectedBookingId(null);
        loadRefundRequests(); // Reload danh sách
      } else {
        alert(result.message || "Không thể hoàn tiền tự động. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Error processing auto refund:", err);
      alert(err.response?.data?.message || err.message || "Đã có lỗi xảy ra khi hoàn tiền tự động");
    } finally {
      setProcessing(false);
    }
  };

  // --- HÀM XÁC NHẬN CHUYỂN TIỀN THỦ CÔNG ---
  const handleConfirmManual = async () => {
    if (!selectedBookingId) return;

    // Đảm bảo bookingId là number
    let numericId: number;
    if (typeof selectedBookingId === 'number') {
      numericId = selectedBookingId;
    } else if (typeof selectedBookingId === 'string') {
      numericId = parseInt(String(selectedBookingId).replace(/BOOK-/gi, ''), 10);
    } else {
      numericId = selectedBookingId as number;
    }
    
    console.log("💰 Confirming manual refund for bookingId:", numericId);

    setProcessing(true);
    try {
      const result = await adminAPI.confirmRefundManually(numericId);
      
      if (result.success) {
        alert(result.message || "Đã xác nhận chuyển tiền thủ công thành công!");
      setConfirmModalOpen(false);
        setSelectedBookingId(null);
        loadRefundRequests(); // Reload danh sách
      } else {
        alert(result.message || "Không thể xác nhận. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Error confirming manual refund:", err);
      alert(err.response?.data?.message || err.message || "Đã có lỗi xảy ra khi xác nhận");
    } finally {
      setProcessing(false);
    }
  };

  // State để lưu QR URLs từ API
  const [qrUrlsCache, setQrUrlsCache] = useState<Record<number, { compactUrl: string; printUrl: string }>>({});
  const [loadingQR, setLoadingQR] = useState<Record<number, boolean>>({});

  // --- HÀM TẠO LINK QR QUA API ---
  const generateQRUrl = async (req: RefundRequest, template: "compact" | "print" = "compact"): Promise<string> => {
    if (!req.bankInfo) return "";

    // Kiểm tra cache trước
    if (qrUrlsCache[req.bookingId]) {
      return template === "compact" ? qrUrlsCache[req.bookingId].compactUrl : qrUrlsCache[req.bookingId].printUrl;
    }

    // Nếu đang load thì return empty
    if (loadingQR[req.bookingId]) {
      return "";
    }

    try {
      setLoadingQR(prev => ({ ...prev, [req.bookingId]: true }));

      const bookingIdFormatted = formatBookingId(req.bookingId, req.bookingIdFormatted);
      const content = `Hoan tien ${bookingIdFormatted}`;

      const qrData = await paymentAPI.generateQR({
        bankCode: req.bankInfo.bankName, // Đã được map từ VietQR (MB, VCB, etc.)
        accountNumber: req.bankInfo.accountNumber,
        amount: req.refundAmount,
        accountHolderName: req.bankInfo.accountHolder,
        content: content,
      });

      // Lưu vào cache
      setQrUrlsCache(prev => ({
        ...prev,
        [req.bookingId]: {
          compactUrl: qrData.compactUrl,
          printUrl: qrData.printUrl,
        },
      }));

      return template === "compact" ? qrData.compactUrl : qrData.printUrl;
    } catch (error: any) {
      console.error("Error generating QR code:", error);
      // Fallback: tạo URL trực tiếp nếu API fail
      const bankId = req.bankInfo.bankName;
      const accountNo = req.bankInfo.accountNumber;
      const amount = req.refundAmount;
      const bookingIdFormatted = formatBookingId(req.bookingId, req.bookingIdFormatted);
      const content = `Hoan tien ${bookingIdFormatted}`;
      const accountName = req.bankInfo.accountHolder;

      return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
    } finally {
      setLoadingQR(prev => {
        const newState = { ...prev };
        delete newState[req.bookingId];
        return newState;
      });
    }
  };

  // Helper để lấy QR URL từ cache hoặc generate
  const getQRUrl = (req: RefundRequest, template: "compact" | "print" = "compact"): string => {
    if (!req.bankInfo) return "";
    
    // Nếu có trong cache, return ngay
    if (qrUrlsCache[req.bookingId]) {
      return template === "compact" ? qrUrlsCache[req.bookingId].compactUrl : qrUrlsCache[req.bookingId].printUrl;
    }

    // Nếu chưa có, trigger async generation (sẽ update sau)
    generateQRUrl(req, template).catch(console.error);
    
    // Return fallback URL tạm thời
     const bankId = req.bankInfo.bankName;
     const accountNo = req.bankInfo.accountNumber;
     const amount = req.refundAmount; 
    const bookingIdFormatted = formatBookingId(req.bookingId, req.bookingIdFormatted);
    const content = `Hoan tien ${bookingIdFormatted}`;
     const accountName = req.bankInfo.accountHolder;

     return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    
    try {
      // Backend có thể trả về nhiều format khác nhau
      // Thử parse với nhiều format
      let date: Date;
      
      // Nếu là ISO string hoặc format chuẩn
      if (dateString.includes('T') || dateString.includes('-')) {
        date = new Date(dateString);
      } else if (dateString.includes('/')) {
        // Format: "25/11/2025" hoặc "2025/11/25"
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Nếu format là DD/MM/YYYY
          if (parts[0].length <= 2) {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            // Nếu format là YYYY/MM/DD
            date = new Date(dateString.replace(/\//g, '-'));
          }
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      // Kiểm tra date hợp lệ
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return dateString; // Trả về string gốc nếu không parse được
      }
      
      // Format: DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return dateString || ""; // Trả về string gốc nếu có lỗi
    }
  };

  // Format booking ID: BOOK-001
  const formatBookingId = (bookingId: number, formatted?: string): string => {
    if (formatted) return formatted;
    return `BOOK-${String(bookingId).padStart(3, '0')}`;
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setStartDate("");
    setEndDate("");
  };

  // Filter requests (client-side filtering for search term)
  const filteredRequests = requests.filter((req) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      String(req.bookingId).toLowerCase().includes(searchLower) ||
      req.customerName.toLowerCase().includes(searchLower) ||
      (req.customerEmail && req.customerEmail.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Quản lý Yêu cầu Hoàn tiền</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Quản lý các yêu cầu hủy phòng và hoàn tiền từ khách hàng
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadRefundRequests}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* THANH CÔNG CỤ TÌM KIẾM & LỌC */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tìm kiếm</label>
              <input 
                type="text"
                placeholder="Mã đơn, tên khách hàng, email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Trạng thái</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="Pending">⏳ Chưa hoàn tiền</option>
                <option value="Completed">✅ Đã hoàn tiền</option>
                <option value="Refunded">✅ Đã hoàn tiền</option>
              </select>
            </div>

            <div className="flex items-end">
               <button 
                 onClick={handleResetFilter}
                 className="w-full px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-200 border border-gray-300 transition-colors"
               >
                 Xóa bộ lọc
               </button>
            </div>

            <div className="col-span-1 md:col-span-2">
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Từ ngày</label>
               <input 
                 type="date" 
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
               />
            </div>
            <div className="col-span-1 md:col-span-2">
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Đến ngày</label>
               <input 
                 type="date" 
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
               />
            </div>

          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền hoàn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thông tin nhận tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quét mã hoàn tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((req) => (
                    <tr key={req.bookingId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {formatBookingId(req.bookingId, req.bookingIdFormatted)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{req.customerName}</div>
                        {req.customerEmail && (
                          <div className="text-xs text-gray-500">{req.customerEmail}</div>
                        )}
                        {req.cancelDate && (
                          <div className="text-xs text-gray-500">Hủy: {formatDate(req.cancelDate)}</div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600 font-bold">
                      {req.refundAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4">
                        {req.bankInfo ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-semibold text-gray-500 w-8 inline-block">NH:</span> {req.bankInfo.bankName}</p>
                        <p><span className="font-semibold text-gray-500 w-8 inline-block">STK:</span> {req.bankInfo.accountNumber}</p>
                        <p><span className="font-semibold text-gray-500 w-8 inline-block">Tên:</span> {req.bankInfo.accountHolder}</p>
                      </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa có thông tin</span>
                        )}
                    </td>
                    
                      {/* Cột QR Code */}
                    <td className="px-6 py-4">
                        {req.status === "Pending" && req.bankInfo ? (
                          <div 
                            className="group relative w-28 cursor-pointer border rounded-lg p-1 bg-white hover:shadow-md transition-all"
                            onClick={async () => {
                              const printUrl = await generateQRUrl(req, "print");
                              setSelectedQR({
                                url: printUrl,
                               title: `Hoàn tiền cho ${req.customerName}`,
                               amount: req.refundAmount,
                                content: `Hoan tien ${formatBookingId(req.bookingId, req.bookingIdFormatted)}`
                              });
                            }}
                          >
                            {loadingQR[req.bookingId] ? (
                              <div className="w-full h-28 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              <>
                                <img 
                                  src={getQRUrl(req, "compact")} 
                               alt="QR" 
                               className="w-full h-auto rounded" 
                                  onError={(e) => {
                                    // Nếu ảnh lỗi, thử load lại
                                    const target = e.target as HTMLImageElement;
                                    setTimeout(() => {
                                      generateQRUrl(req, "compact").then(url => {
                                        if (url) target.src = url;
                                      });
                                    }, 1000);
                                  }}
                             />
                             <div className="text-[10px] text-center mt-1 text-blue-600 font-medium">
                               🔍 Phóng to
                             </div>
                              </>
                            )}
                          </div>
                       ) : (
                          <span className="text-xs text-gray-400 italic">--</span>
                       )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <RefundStatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req.status === "Pending" ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => openConfirmModal(req.bookingId, "auto")}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700 shadow-sm transition-colors font-medium"
                              title="Hoàn tiền tự động qua Cas API"
                            >
                              💰 Hoàn tự động
                            </button>
                        <button
                              onClick={() => openConfirmModal(req.bookingId, "manual")}
                              className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 shadow-sm transition-colors font-medium"
                              title="Xác nhận đã chuyển tiền thủ công"
                        >
                              ✅ Xác nhận thủ công
                        </button>
                          </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          Đã xử lý xong
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-4xl mb-2">🔍</span>
                        <p className="text-lg font-medium">Không tìm thấy kết quả phù hợp</p>
                        <p className="text-sm text-gray-400 mt-1">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* MODAL PHÓNG TO QR */}
      {selectedQR && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
          onClick={() => setSelectedQR(null)}
        >
          <div 
            className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-center mb-4 text-gray-800">{selectedQR.title}</h3>
            
            <div className="bg-gray-100 p-4 rounded-lg">
               <img src={selectedQR.url} alt="QR Full" className="w-full h-auto rounded-md" />
            </div>
            
            <div className="mt-4 space-y-2 text-center">
                <p className="text-sm text-gray-600">Số tiền hoàn:</p>
                <p className="text-xl font-bold text-green-600">{selectedQR.amount.toLocaleString('vi-VN')} đ</p>
                <p className="text-sm text-gray-600 mt-2">Nội dung:</p>
                <p className="text-sm font-medium bg-gray-100 p-2 rounded border border-gray-200 inline-block">{selectedQR.content}</p>
            </div>

            <button 
              onClick={() => setSelectedQR(null)}
              className="mt-6 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN */}
      {confirmModalOpen && (() => {
        // Tìm refund request tương ứng với selectedBookingId
        const selectedRequest = requests.find(req => req.bookingId === selectedBookingId);

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
                {refundType === "auto" ? "Hoàn tiền tự động?" : "Xác nhận đã chuyển khoản?"}
            </h3>
              <p className="text-gray-600 mb-4">
                {refundType === "auto" 
                  ? "Bạn có muốn hoàn tiền tự động cho khách hàng qua Cas Transfer API? Hệ thống sẽ tự động chuyển tiền vào tài khoản ngân hàng của khách hàng."
                  : "Bạn xác nhận rằng đã chuyển tiền thành công cho khách hàng này qua ngân hàng? Hành động này sẽ cập nhật trạng thái đơn hàng thành \"Đã hoàn tiền\"."}
              </p>
              
              {/* Hiển thị QR code khi xác nhận thủ công */}
              {refundType === "manual" && selectedRequest?.bankInfo && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📱 QR Code chuyển khoản</h4>
                  
                  {/* Thông tin chuyển khoản */}
                  <div className="mb-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Khách hàng:</span>
                      <span className="font-medium text-gray-900">{selectedRequest.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-bold text-green-600 text-lg">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedRequest.refundAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngân hàng:</span>
                      <span className="font-medium text-gray-900">{selectedRequest.bankInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tài khoản:</span>
                      <span className="font-medium text-gray-900">{selectedRequest.bankInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chủ tài khoản:</span>
                      <span className="font-medium text-gray-900">{selectedRequest.bankInfo.accountHolder}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    {loadingQRModal ? (
                      <div className="w-64 h-64 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Đang tạo QR code...</p>
                        </div>
                      </div>
                    ) : qrUrlModal ? (
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <img 
                          src={qrUrlModal} 
                          alt="QR Code chuyển khoản" 
                          className="w-64 h-64 mx-auto"
                          onError={(e) => {
                            console.error("QR code image failed to load");
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <p className="text-xs text-center text-gray-500 mt-2">
                          Quét mã QR để chuyển khoản
                        </p>
                      </div>
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-500 text-center">Không thể tạo QR code</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {refundType === "auto" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hoàn tiền (tùy chọn)</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    rows={3}
                    placeholder="Nhập lý do hoàn tiền..."
                  />
                </div>
              )}
              
            <div className="flex justify-end space-x-3">
              <button
                  onClick={() => {
                    setConfirmModalOpen(false);
                    setSelectedBookingId(null);
                    setRefundReason("");
                    setQrUrlModal("");
                  }}
                  disabled={processing}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                  onClick={refundType === "auto" ? handleAutoRefund : handleConfirmManual}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                  {processing ? "Đang xử lý..." : refundType === "auto" ? "Hoàn tiền tự động" : "Xác nhận ngay"}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

    </div>
  );
};

export default PageAdminRefund;
