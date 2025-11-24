import React, { useState } from "react";

// --- Định nghĩa kiểu dữ liệu ---
// LƯU Ý: 'bank' dùng Mã ngân hàng chuẩn của VietQR (MB, VCB, TCB, ACB...)
interface Payout {
  id: number;
  hostName: string;
  bankInfo: { bank: string; acc: string; name: string };
  totalBookings: number;
  totalRevenue: number;
  paidToOwner: number;
  period: string;
  status: "Pending" | "Paid";
  payoutDate: string; // Ngày chốt sổ (dd/mm/yyyy) để lọc
}

const mockPayouts: Payout[] = [
  {
    id: 1,
    hostName: "Nguyễn Văn A",
    bankInfo: { bank: "MB", acc: "0333666999", name: "NGUYEN VAN A" },
    totalBookings: 12,
    totalRevenue: 45000000,
    paidToOwner: 45000000,
    period: "01/11 - 15/11",
    status: "Pending",
    payoutDate: "15/11/2025"
  },
  {
    id: 2,
    hostName: "Trần Thị B",
    bankInfo: { bank: "VCB", acc: "0011223344", name: "TRAN THI B" },
    totalBookings: 5,
    totalRevenue: 9000000,
    paidToOwner: 9000000,
    period: "01/11 - 15/11",
    status: "Paid",
    payoutDate: "15/11/2025"
  },
  {
    id: 3,
    hostName: "Lê Văn C",
    bankInfo: { bank: "TCB", acc: "190333444555", name: "LE VAN C" },
    totalBookings: 8,
    totalRevenue: 15500000,
    paidToOwner: 15500000,
    period: "16/11 - 30/11",
    status: "Pending",
    payoutDate: "30/11/2025"
  }
];

// --- Helper: Chuyển chuỗi "dd/mm/yyyy" thành Date object ---
const parseDate = (dateStr: string) => {
  const [day, month, year] = dateStr.split("/");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const PageAdminPayout = () => {
  const [payouts, setPayouts] = useState(mockPayouts);
  
  // State để quản lý Modal phóng to QR
  const [selectedQR, setSelectedQR] = useState<{ url: string; title: string; amount: number; content: string } | null>(null);

  // ✨ STATE CHO MODAL XÁC NHẬN (MỚI - THAY THẾ WINDOW.CONFIRM)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedIdToConfirm, setSelectedIdToConfirm] = useState<number | null>(null);

  // STATE CHO BỘ LỌC
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState(""); 
  const [endDate, setEndDate] = useState("");

  // --- HÀM MỞ MODAL XÁC NHẬN ---
  const openConfirmModal = (id: number) => {
    setSelectedIdToConfirm(id);
    setConfirmModalOpen(true);
  };

  // --- HÀM THỰC HIỆN CHUYỂN KHOẢN (KHI BẤM YES Ở MODAL) ---
  const handleConfirmTransferAction = () => {
    if (selectedIdToConfirm !== null) {
      // TODO: Gọi API cập nhật trạng thái Payout thành 'Paid'
      console.log("Admin xác nhận đã thanh toán cho payout ID:", selectedIdToConfirm);

      setPayouts(prev => prev.map(p => p.id === selectedIdToConfirm ? { ...p, status: "Paid" } : p));
      
      // Đóng modal và reset
      setConfirmModalOpen(false);
      setSelectedIdToConfirm(null);
    }
  };

  // --- HÀM TẠO LINK QR (VIETQR) ---
  const generateQRUrl = (payout: any, template: "compact" | "print" = "compact") => {
     const bankId = payout.bankInfo.bank;
     const accountNo = payout.bankInfo.acc;
     const amount = payout.paidToOwner; 
     const content = `Thanh toan ky ${payout.period.replace(/\//g, "-")}`;
     const accountName = payout.bankInfo.name;

     // Link API VietQR với amount và addInfo
     return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
  };

  // LOGIC LỌC DỮ LIỆU
  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch = 
      p.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bankInfo.acc.includes(searchTerm);

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;

    let matchesDate = true;
    const pDate = parseDate(p.payoutDate); 

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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
           <div>
             <h1 className="text-2xl font-bold text-gray-800">Quyết toán Doanh thu</h1>
             <p className="text-sm text-gray-500 mt-1">Quản lý việc chuyển tiền doanh thu cho Chủ nhà.</p>
           </div>
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
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.period}</td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{p.hostName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {p.bankInfo.bank} - <span className="font-mono text-gray-700 font-semibold">{p.bankInfo.acc}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase">{p.bankInfo.name}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {p.totalBookings} đơn
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold text-lg">
                      {p.paidToOwner.toLocaleString('vi-VN')} đ
                    </td>

                    <td className="px-6 py-4">
                       {p.status === "Pending" ? (
                          <div 
                            className="group relative w-28 cursor-pointer border rounded-lg p-1 bg-white hover:shadow-md transition-all"
                            onClick={() => setSelectedQR({
                               url: generateQRUrl(p, "print"),
                               title: `Chuyển khoản cho ${p.hostName}`,
                               amount: p.paidToOwner,
                               content: `Thanh toan ky ${p.period.replace(/\//g, "-")}`
                            })}
                          >
                             <img 
                               src={generateQRUrl(p, "compact")} 
                               alt="QR" 
                               className="w-full h-auto rounded" 
                             />
                             <div className="text-[10px] text-center mt-1 text-blue-600 font-medium">
                               🔍 Phóng to
                             </div>
                          </div>
                       ) : (
                          <span className="text-xs text-gray-400 italic">--</span>
                       )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.status === "Pending" ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Chờ thanh toán</span>
                      ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Đã thanh toán</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.status === "Pending" && (
                        <button 
                          // ✨ THAY ĐỔI: GỌI HÀM MỞ MODAL THAY VÌ WINDOW.CONFIRM
                          onClick={() => openConfirmModal(p.id)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Xác nhận
                        </button>
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
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Xác nhận đã chuyển khoản?
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn xác nhận rằng đã chuyển tiền thành công cho Chủ nhà này qua ngân hàng? Hành động này sẽ cập nhật trạng thái đợt thanh toán thành <strong>"Đã thanh toán"</strong>.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmTransferAction}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm transition-colors"
              >
                Xác nhận ngay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PageAdminPayout;