import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import payoutAPI, { HostPayoutDTO } from "api/payout";
import moment from "moment";
import { toastError, toastSuccess, toastWarning } from "utils/toast";

// --- Định nghĩa kiểu dữ liệu ---
// LƯU Ý: 'bank' dùng Mã ngân hàng chuẩn của VietQR (MB, VCB, TCB, ACB...)
interface GroupedPayout {
  hostId: number;
  hostName: string;
  bankInfo: { bank: string; acc: string; name: string };
  bookings: HostPayoutDTO[]; // Danh sách bookings của host này
  totalBookings: number;
  totalAmount: number;
  status: "Pending" | "Paid"; // "Pending" nếu có ít nhất 1 booking chưa paid
  earliestDate: string; // Ngày sớm nhất trong các bookings
  latestDate: string; // Ngày muộn nhất trong các bookings
}

// --- Helper: Map tên ngân hàng sang mã VietQR ---
const getBankCode = (bankName: string | undefined): string => {
  if (!bankName) return "MB";
  const bankMap: Record<string, string> = {
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
    "Eximbank": "EIB",
    "MSB": "MSB",
  };
  
  const upperName = bankName.toUpperCase();
  for (const [key, value] of Object.entries(bankMap)) {
    if (upperName.includes(key.toUpperCase())) {
      return value;
    }
  }
  
  // Nếu không tìm thấy, thử lấy 3 ký tự đầu
  return bankName.substring(0, 3).toUpperCase();
};

// --- Helper: Group bookings theo host ---
const groupPayoutsByHost = (bookings: HostPayoutDTO[]): GroupedPayout[] => {
  const grouped = new Map<number, GroupedPayout>();
  
  bookings.forEach((booking) => {
    const hostId = booking.hostId || 0;
    
    if (!grouped.has(hostId)) {
      grouped.set(hostId, {
        hostId: hostId,
        hostName: booking.hostName || "Unknown Host",
        bankInfo: {
          bank: getBankCode(booking.bankName),
          acc: booking.accountNumber || "",
          name: booking.accountHolderName || booking.hostName || "",
        },
        bookings: [],
        totalBookings: 0,
        totalAmount: 0,
        status: "Pending",
        earliestDate: booking.completedAt || booking.endDate || "",
        latestDate: booking.completedAt || booking.endDate || "",
      });
    }
    
    const group = grouped.get(hostId)!;
    group.bookings.push(booking);
    
    // Chỉ tính totalBookings và totalAmount cho các booking chưa paid và chưa bị reject
    if (!booking.isPaidToHost && !booking.isPaid && !booking.isRejected) {
      group.totalBookings += 1;
      group.totalAmount += booking.amount || booking.totalPrice || 0;
    }
    
    // Cập nhật earliest và latest date
    const bookingDate = booking.completedAt || booking.endDate || "";
    if (bookingDate) {
      if (!group.earliestDate || bookingDate < group.earliestDate) {
        group.earliestDate = bookingDate;
      }
      if (!group.latestDate || bookingDate > group.latestDate) {
        group.latestDate = bookingDate;
      }
    }
  });
  
  // Sau khi group xong, cập nhật status dựa trên số lượng pending bookings (chưa paid và chưa bị reject)
  const result = Array.from(grouped.values());
  result.forEach((group) => {
    const hasPending = group.bookings.some(
      (b) => !b.isPaidToHost && !b.isPaid && !b.isRejected
    );
    group.status = hasPending ? "Pending" : "Paid";
  });
  
  return result;
};

// --- Helper: Format period từ dates ---
const formatPeriod = (earliest: string, latest: string): string => {
  if (!earliest || !latest) return "N/A";
  try {
    const start = moment(earliest);
    const end = moment(latest);
    return `${start.format("DD/MM")} - ${end.format("DD/MM")}`;
  } catch {
    return "N/A";
  }
};

// --- Helper: Chuyển chuỗi date thành Date object ---
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  try {
    return moment(dateStr).toDate();
  } catch {
    return new Date();
  }
};

const PageAdminPayout = () => {
  const [groupedPayouts, setGroupedPayouts] = useState<GroupedPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // State để track các booking đã bị reject (nếu backend không có field isRejected)
  // Key: bookingId, Value: { rejectedAt: timestamp, reason: string }
  const [rejectedBookings, setRejectedBookings] = useState<Map<number, { rejectedAt: string; reason: string }>>(new Map());
  
  // State để quản lý Modal phóng to QR
  const [selectedQR, setSelectedQR] = useState<{ url: string; title: string; amount: number; content: string } | null>(null);

  // ✨ STATE CHO MODAL XÁC NHẬN (MỚI - THAY THẾ WINDOW.CONFIRM)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPayoutToConfirm, setSelectedPayoutToConfirm] = useState<GroupedPayout | null>(null);

  // ✨ STATE CHO MODAL TỪ CHỐI
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPayoutToReject, setSelectedPayoutToReject] = useState<GroupedPayout | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // STATE CHO BỘ LỌC
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState(""); 
  const [endDate, setEndDate] = useState("");
  
  // Load rejected bookings từ localStorage (persist across page reloads)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("rejectedPayoutBookings");
      if (stored) {
        const parsed = JSON.parse(stored);
        const map = new Map<number, { rejectedAt: string; reason: string }>();
        Object.entries(parsed).forEach(([key, value]) => {
          map.set(Number(key), value as { rejectedAt: string; reason: string });
        });
        setRejectedBookings(map);
      }
    } catch (error) {
      // Failed to load rejected bookings from localStorage
    }
  }, []);

  // Load data từ API
  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      // Load cả pending và paid payouts để có thể filter theo status
      const [pendingData, paidData] = await Promise.all([
        payoutAPI.getAdminPendingPayouts(),
        payoutAPI.getAdminPaidPayouts(),
      ]);
      
      // Filter ra các booking đã bị reject (nếu có field isRejected)
      // Hoặc có thể backend không trả về các booking đã reject trong pending list
      const validPendingData = pendingData.filter(
        (booking) => !booking.isRejected
      );
      
      // Combine và group theo host
      // Logic group sẽ chỉ tính totalAmount cho các booking pending và chưa bị reject
      const allBookings = [...validPendingData, ...paidData];
      const grouped = groupPayoutsByHost(allBookings);
      
      setGroupedPayouts(grouped);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Không thể tải danh sách thanh toán";
      toastError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM MỞ MODAL XÁC NHẬN ---
  const openConfirmModal = (payout: GroupedPayout) => {
    setSelectedPayoutToConfirm(payout);
    setConfirmModalOpen(true);
  };

  // --- HÀM MỞ MODAL TỪ CHỐI ---
  const openRejectModal = (payout: GroupedPayout) => {
    setSelectedPayoutToReject(payout);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  // --- HÀM THỰC HIỆN XÁC NHẬN THANH TOÁN (KHI BẤM YES Ở MODAL) ---
  const handleConfirmTransferAction = async () => {
    if (!selectedPayoutToConfirm) return;

    setProcessing(true);
    try {
      // Confirm tất cả bookings chưa được paid của host này
      const pendingBookings = selectedPayoutToConfirm.bookings.filter(
        (b) => !b.isPaidToHost && !b.isPaid
      );

      if (pendingBookings.length === 0) {
        toast.warning("Không có booking nào cần xác nhận thanh toán");
        setConfirmModalOpen(false);
        setSelectedPayoutToConfirm(null);
        setProcessing(false);
        return;
      }

      // Confirm từng booking
      let successCount = 0;
      let failCount = 0;

      for (const booking of pendingBookings) {
        try {
          await payoutAPI.confirmPayout(booking.bookingId);
          successCount++;
        } catch (error: any) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toastSuccess(`Đã xác nhận thanh toán cho ${successCount} booking${successCount > 1 ? "s" : ""} của ${selectedPayoutToConfirm.hostName}`);
      }
      if (failCount > 0) {
        toastError(`Không thể xác nhận ${failCount} booking${failCount > 1 ? "s" : ""}`);
      }

      // Reload data
      await loadPayouts();
      
      // Đóng modal và reset
      setConfirmModalOpen(false);
      setSelectedPayoutToConfirm(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Không thể xác nhận thanh toán";
      toastError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // --- HÀM THỰC HIỆN TỪ CHỐI THANH TOÁN ---
  const handleRejectPayoutAction = async () => {
    if (!selectedPayoutToReject || !rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setProcessing(true);
    try {
      // Reject tất cả bookings chưa được paid của host này
      const pendingBookings = selectedPayoutToReject.bookings.filter(
        (b) => !b.isPaidToHost && !b.isPaid
      );

      if (pendingBookings.length === 0) {
        toast.warning("Không có booking nào cần từ chối");
        setRejectModalOpen(false);
        setSelectedPayoutToReject(null);
        setRejectReason("");
        setProcessing(false);
        return;
      }

      // Reject từng booking
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const booking of pendingBookings) {
        try {
          await payoutAPI.rejectPayout(booking.bookingId, rejectReason.trim());
          successCount++;
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || error.message || "Unknown error";
          errors.push(`Booking ${booking.bookingId}: ${errorMsg}`);
          failCount++;
        }
      }

      if (successCount > 0) {
        toastSuccess(`Đã từ chối thanh toán cho ${successCount} booking${successCount > 1 ? "s" : ""} của ${selectedPayoutToReject.hostName}`);
      }
      if (failCount > 0) {
        toastError(`Không thể từ chối ${failCount} booking${failCount > 1 ? "s" : ""}. ${errors.length > 0 ? errors[0] : ""}`);
      }

      // Đợi một chút để backend xử lý xong trước khi reload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload data để cập nhật danh sách (các booking đã reject sẽ không còn trong pending list)
      await loadPayouts();
      
      // Đóng modal và reset
      setRejectModalOpen(false);
      setSelectedPayoutToReject(null);
      setRejectReason("");
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Không thể từ chối thanh toán";
      toastError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // --- HÀM TẠO LINK QR (VIETQR) ---
  const generateQRUrl = (payout: GroupedPayout, template: "compact" | "print" = "compact") => {
     const bankId = payout.bankInfo.bank;
     const accountNo = payout.bankInfo.acc;
     const amount = payout.totalAmount; 
     const period = formatPeriod(payout.earliestDate, payout.latestDate);
     const content = `Thanh toan ky ${period.replace(/\//g, "-")}`;
     const accountName = payout.bankInfo.name;

     // Link API VietQR với amount và addInfo
     return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
  };

  // LOGIC LỌC DỮ LIỆU
  const filteredPayouts = groupedPayouts.filter((p) => {
    const matchesSearch = 
      p.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bankInfo.acc.includes(searchTerm);

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;

    let matchesDate = true;
    const pDate = parseDate(p.latestDate); 

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (pDate < start) matchesDate = false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); 
      if (pDate > end) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleResetFilter = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
           <div>
             <h1 className="text-2xl font-bold text-gray-800">Quyết toán Doanh thu</h1>
             <p className="text-sm text-gray-500 mt-1">Quản lý việc chuyển tiền doanh thu cho Chủ nhà.</p>
           </div>
           <button
             onClick={loadPayouts}
             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
           >
             🔄 Làm mới
           </button>
        </div>

        {/* THANH CÔNG CỤ TÌM KIẾM & LỌC */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tìm kiếm</label>
              <input 
                type="text"
                placeholder="Tên chủ nhà, số tài khoản..."
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
                <option value="Pending">⏳ Chờ thanh toán</option>
                <option value="Paid">✅ Đã thanh toán</option>
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
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kỳ chốt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chủ nhà & TK Nhận tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền phải chuyển</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quét mã chuyển tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayouts.map((p) => (
                  <tr key={p.hostId} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatPeriod(p.earliestDate, p.latestDate)}
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{p.hostName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {p.bankInfo.bank} - <span className="font-mono text-gray-700 font-semibold">{p.bankInfo.acc}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase">{p.bankInfo.name}</div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 text-center">
                      {p.totalBookings} đơn
                    </td>

                    <td className="px-4 py-4 text-green-600 font-bold text-lg">
                      {p.totalAmount.toLocaleString('vi-VN')} đ
                    </td>

                    <td className="px-4 py-4 text-center">
                       {p.status === "Pending" && p.bankInfo.acc ? (
                          <div 
                            className="group relative w-24 mx-auto cursor-pointer border rounded-lg p-1 bg-white hover:shadow-md transition-all"
                            onClick={() => {
                              const period = formatPeriod(p.earliestDate, p.latestDate);
                              setSelectedQR({
                                url: generateQRUrl(p, "print"),
                                title: `Chuyển khoản cho ${p.hostName}`,
                                amount: p.totalAmount,
                                content: `Thanh toan ky ${period.replace(/\//g, "-")}`
                              });
                            }}
                            title="Click để phóng to QR Code"
                          >
                             <img 
                               src={generateQRUrl(p, "compact")} 
                               alt="QR" 
                               className="w-full h-auto rounded" 
                             />
                             <div className="text-[9px] text-center mt-1 text-blue-600 font-medium">
                               🔍 Phóng to
                             </div>
                          </div>
                       ) : (
                          <span className="text-xs text-gray-400 italic">--</span>
                       )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {p.status === "Pending" ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Chờ thanh toán</span>
                      ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Đã thanh toán</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {p.status === "Pending" ? (
                        <div className="flex flex-col gap-2 min-w-[160px]">
                          <button 
                            onClick={() => openConfirmModal(p)}
                            disabled={processing}
                            className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            title="Xác nhận đã chuyển khoản"
                          >
                            {processing ? "⏳ Đang xử lý..." : "✅ Xác nhận"}
                          </button>
                          <button 
                            onClick={() => openRejectModal(p)}
                            disabled={processing}
                            className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            title="Từ chối thanh toán"
                          >
                            ❌ Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic text-center block">--</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredPayouts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-4xl mb-2">🔍</span>
                        <p className="text-lg font-medium">Không tìm thấy kết quả phù hợp</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL PHÓNG TO QR --- */}
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
                <p className="text-sm text-gray-600">Số tiền chuyển:</p>
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

      {/* ✨ MODAL XÁC NHẬN TÙY CHỈNH (CUSTOM MODAL) - THAY THẾ WINDOW.CONFIRM */}
      {confirmModalOpen && selectedPayoutToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Xác nhận đã chuyển khoản?
            </h3>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Chủ nhà:</strong> {selectedPayoutToConfirm.hostName}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Số booking:</strong> {selectedPayoutToConfirm.bookings.filter(b => !b.isPaidToHost && !b.isPaid).length} booking(s)
              </p>
              <p className="text-sm text-gray-700">
                <strong>Tổng tiền:</strong> <span className="text-green-600 font-bold">{selectedPayoutToConfirm.totalAmount.toLocaleString('vi-VN')} đ</span>
              </p>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn xác nhận rằng đã chuyển tiền thành công cho Chủ nhà này qua ngân hàng? Hành động này sẽ cập nhật trạng thái các booking thành <strong>"Đã thanh toán"</strong>.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setSelectedPayoutToConfirm(null);
                }}
                disabled={processing}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmTransferAction}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {processing ? "Đang xử lý..." : "Xác nhận ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL TỪ CHỐI THANH TOÁN */}
      {rejectModalOpen && selectedPayoutToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
            <h3 className="text-lg font-bold text-red-600 mb-4">
              Từ chối thanh toán
            </h3>
            <div className="mb-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Chủ nhà:</strong> {selectedPayoutToReject.hostName}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Số booking:</strong> {selectedPayoutToReject.bookings.filter(b => !b.isPaidToHost && !b.isPaid).length} booking(s)
              </p>
              <p className="text-sm text-gray-700">
                <strong>Tổng tiền:</strong> <span className="text-red-600 font-bold">{selectedPayoutToReject.totalAmount.toLocaleString('vi-VN')} đ</span>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối thanh toán..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Lý do từ chối sẽ được gửi qua email cho chủ nhà.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedPayoutToReject(null);
                  setRejectReason("");
                }}
                disabled={processing}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRejectPayoutAction}
                disabled={processing || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PageAdminPayout;