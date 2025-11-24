import React, { useState } from "react";

// --- Định nghĩa kiểu dữ liệu ---
interface RefundRequest {
  id: number;
  bookingId: string;
  customerName: string;
  refundAmount: number;
  // LƯU Ý: 'bankName' nên dùng Mã ngân hàng chuẩn của VietQR (MB, VCB, TCB, ACB...) để tạo QR chính xác
  // Ở đây giả sử dữ liệu đã chuẩn hóa hoặc bạn cần map lại nếu dùng tên dài
  bankInfo: {
    bankName: string; // Ví dụ: "MB", "VCB"
    accountNumber: string;
    accountHolder: string;
  };
  status: "Pending" | "Completed";
  cancelDate: string;
}

// --- Dữ liệu giả lập ---
const mockRefundRequests: RefundRequest[] = [
  {
    id: 101,
    bookingId: "BOOK-001",
    customerName: "Nguyễn Văn An",
    refundAmount: 1150000,
    bankInfo: {
      bankName: "MB", // Dùng mã ngắn
      accountNumber: "0987654321",
      accountHolder: "NGUYEN VAN AN"
    },
    status: "Pending",
    cancelDate: "22/11/2025"
  },
  {
    id: 102,
    bookingId: "BOOK-005",
    customerName: "Trần Thị B",
    refundAmount: 500000,
    bankInfo: {
      bankName: "VCB", // Dùng mã ngắn
      accountNumber: "001100223344",
      accountHolder: "TRAN THI B"
    },
    status: "Pending",
    cancelDate: "21/11/2025"
  },
  {
    id: 103,
    bookingId: "BOOK-008",
    customerName: "Lê Văn C",
    refundAmount: 2000000,
    bankInfo: {
      bankName: "TCB", // Dùng mã ngắn
      accountNumber: "190333444555",
      accountHolder: "LE VAN C"
    },
    status: "Completed",
    cancelDate: "20/11/2025"
  },
  {
    id: 104,
    bookingId: "BOOK-012",
    customerName: "Phạm Thị D",
    refundAmount: 750000,
    bankInfo: {
      bankName: "ACB", // Dùng mã ngắn
      accountNumber: "888999",
      accountHolder: "PHAM THI D"
    },
    status: "Completed",
    cancelDate: "10/11/2025"
  }
];

// --- Component hiển thị Badge trạng thái ---
const RefundStatusBadge: React.FC<{ status: "Pending" | "Completed" }> = ({ status }) => {
  if (status === "Completed") {
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
  const [requests, setRequests] = useState<RefundRequest[]>(mockRefundRequests);
  
  // STATE CHO BỘ LỌC
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState(""); 
  const [endDate, setEndDate] = useState("");

  // STATE CHO MODAL XÁC NHẬN
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedIdToRefund, setSelectedIdToRefund] = useState<number | null>(null);

  // STATE CHO MODAL QR
  const [selectedQR, setSelectedQR] = useState<{ url: string; title: string; amount: number; content: string } | null>(null);

  // --- HÀM MỞ MODAL XÁC NHẬN ---
  const openConfirmModal = (id: number) => {
    setSelectedIdToRefund(id);
    setConfirmModalOpen(true);
  };

  // --- HÀM THỰC HIỆN HOÀN TIỀN ---
  const handleConfirmAction = () => {
    if (selectedIdToRefund !== null) {
      console.log("Admin đã hoàn tiền cho request:", selectedIdToRefund);
      
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === selectedIdToRefund ? { ...req, status: "Completed" } : req
        )
      );
      
      setConfirmModalOpen(false);
      setSelectedIdToRefund(null);
    }
  };

  // --- HÀM TẠO LINK QR (VIETQR) ---
  const generateQRUrl = (req: RefundRequest, template: "compact" | "print" = "compact") => {
     const bankId = req.bankInfo.bankName;
     const accountNo = req.bankInfo.accountNumber;
     const amount = req.refundAmount; 
     const content = `Hoan tien ${req.bookingId}`; // Nội dung chuyển khoản
     const accountName = req.bankInfo.accountHolder;

     return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || req.status === filterStatus;

    let matchesDate = true;
    const reqDate = parseDate(req.cancelDate); 

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (reqDate < start) matchesDate = false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); 
      if (reqDate > end) matchesDate = false;
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý Yêu cầu Hoàn tiền</h1>

        {/* THANH CÔNG CỤ TÌM KIẾM & LỌC */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tìm kiếm</label>
              <input 
                type="text"
                placeholder="Mã đơn, tên khách hàng..."
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
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Từ ngày hủy</label>
               <input 
                 type="date" 
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
               />
            </div>
            <div className="col-span-1 md:col-span-2">
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Đến ngày hủy</label>
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
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {req.bookingId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{req.customerName}</div>
                      <div className="text-xs text-gray-500">Hủy: {req.cancelDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600 font-bold">
                      {req.refundAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-semibold text-gray-500 w-8 inline-block">NH:</span> {req.bankInfo.bankName}</p>
                        <p><span className="font-semibold text-gray-500 w-8 inline-block">STK:</span> {req.bankInfo.accountNumber}</p>
                        <p><span className="font-semibold text-gray-500 w-8 inline-block">Tên:</span> {req.bankInfo.accountHolder}</p>
                      </div>
                    </td>
                    
                    {/* Cột QR Code mới */}
                    <td className="px-6 py-4">
                       {req.status === "Pending" ? (
                          <div 
                            className="group relative w-28 cursor-pointer border rounded-lg p-1 bg-white hover:shadow-md transition-all"
                            onClick={() => setSelectedQR({
                               url: generateQRUrl(req, "print"),
                               title: `Hoàn tiền cho ${req.customerName}`,
                               amount: req.refundAmount,
                               content: `Hoan tien ${req.bookingId}`
                            })}
                          >
                             <img 
                               src={generateQRUrl(req, "compact")} 
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
                      <RefundStatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req.status === "Pending" ? (
                        <button
                          onClick={() => openConfirmModal(req.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 shadow-sm transition-colors font-medium focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                        >
                          Xác nhận chuyển
                        </button>
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
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Xác nhận đã chuyển khoản?
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn xác nhận rằng đã chuyển tiền thành công cho khách hàng này qua ngân hàng? Hành động này sẽ cập nhật trạng thái đơn hàng thành <strong>"Đã hoàn tiền"</strong>.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmAction}
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

export default PageAdminRefund;