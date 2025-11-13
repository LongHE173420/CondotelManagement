// 1. IMPORT THÊM useEffect
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// ... (Interface Voucher và Component VoucherCard giữ nguyên) ...

interface Voucher {
  id: string;
  code: string;
  type: "percentage" | "amount";
  value: number;
  description: string;
  endDate: string;
}
const VoucherCard: React.FC<{ voucher: Voucher }> = ({ voucher }) => {
  const isPercentage = voucher.type === "percentage";
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xl font-bold text-gray-800 tracking-wider bg-gray-100 px-3 py-1 rounded">
            {voucher.code}
          </span>
          <span className="text-xl font-semibold text-blue-600">
            {isPercentage ? `Giảm ${voucher.value}%` : `Giảm ${voucher.value.toLocaleString("vi-VN")} VNĐ`}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4 h-12">{voucher.description}</p>
        <p className="text-sm text-red-600 font-medium">
          Hết hạn: {voucher.endDate}
        </p>
      </div>
      <div className="bg-gray-50 p-4">
        <Link 
          to="/listing-stay"
          className="w-full text-center block px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          Dùng ngay
        </Link>
      </div>
    </div>
  );
};

// --- Component Trang Ví Voucher (Tenant) ---
const PageMyVouchers = () => {
  // 2. KHỞI TẠO STATE RỖNG VÀ THÊM LOADING
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 3. DÙNG useEffect ĐỂ GỌI API KHI TRANG TẢI
  useEffect(() => {
    const fetchMyVouchers = async () => {
      setIsLoading(true);
      try {
        // TODO: Thay thế bằng API thật của bạn
        // Token xác thực (chứa ID khách hàng) sẽ được gửi tự động
        // trong header (Authorization) bởi trình duyệt.
        
        // const response = await fetch("/api/my-vouchers"); 
        // const data = await response.json();
        
        // --- Dữ liệu giả lập cho API ---
        const mockVoucherData: Voucher[] = [
          { id: "1", code: "SALE30", type: "percentage", value: 30, description: "Giảm 30% cho tất cả các condotel.", endDate: "20/11/2025" },
          { id: "2", code: "GIAM100K", type: "amount", value: 100000, description: "Giảm 100.000 VNĐ cho các condotel tại Vũng Tàu.", endDate: "30/11/2025" },
        ];
        // Giả lập độ trễ mạng
        await new Promise(resolve => setTimeout(resolve, 500)); 
        // --- Hết dữ liệu giả lập ---

        setVouchers(mockVoucherData); // Thay `mockVoucherData` bằng `data`
      
      } catch (error) {
        console.error("Lỗi khi tải voucher của bạn:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyVouchers();
  }, []); // Mảng rỗng `[]` nghĩa là chỉ chạy 1 lần khi component mount

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      
      {/* --- Tiêu đề trang --- */}
      <div className="max-w-7xl mx-auto mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Ví Voucher Của Bạn
        </h2>
        <p className="text-gray-600">Những voucher có sẵn để bạn sử dụng.</p>
      </div>

      {/* --- 4. XỬ LÝ TRẠNG THÁI LOADING VÀ RỖNG --- */}
      {isLoading ? (
        <div className="max-w-7xl mx-auto text-center py-10">
          <p>Đang tải voucher...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-10">
          <p>Bạn chưa có voucher nào.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => (
            <VoucherCard key={voucher.id} voucher={voucher} />
          ))}
        </div>
      )}
      
    </div>
  );
};

export default PageMyVouchers;