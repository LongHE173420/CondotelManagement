import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import voucherAPI, { VoucherDTO } from "api/voucher";
import moment from "moment";

interface Voucher {
  id: string;
  code: string;
  type: "percentage" | "amount";
  value: number;
  description: string;
  endDate: string;
  condotelName?: string;
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
        console.log("🔄 Loading my vouchers...");
        const vouchersData = await voucherAPI.getMyVouchers();
        console.log("✅ My vouchers loaded:", vouchersData);
        
        // Filter: chỉ lấy voucher active và chưa hết hạn
        const now = new Date();
        const activeVouchers = vouchersData.filter(v => {
          if (!v.isActive) return false;
          const endDate = new Date(v.endDate);
          const startDate = new Date(v.startDate);
          return startDate <= now && endDate >= now;
        });
        
        // Map VoucherDTO sang Voucher format cho component
        const mappedVouchers: Voucher[] = activeVouchers.map((v: VoucherDTO) => {
          const condotelName = (v as any).condotelName;
          return {
            id: v.voucherId.toString(),
            code: v.code,
            type: v.discountPercentage ? "percentage" : "amount",
            value: v.discountPercentage || v.discountAmount || 0,
            description: v.description || (v.discountPercentage 
              ? `Giảm ${v.discountPercentage}% cho ${condotelName ? `condotel ${condotelName}` : 'tất cả condotel'}.`
              : `Giảm ${(v.discountAmount || 0).toLocaleString()} đ cho ${condotelName ? `condotel ${condotelName}` : 'tất cả condotel'}.`),
            endDate: moment(v.endDate).format("DD/MM/YYYY"),
            condotelName: condotelName,
          };
        });

        setVouchers(mappedVouchers);
        console.log("✅ Mapped vouchers:", mappedVouchers.length);
      
      } catch (error) {
        console.error("❌ Lỗi khi tải voucher của bạn:", error);
        setVouchers([]);
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