import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import voucherAPI, { VoucherDTO } from "api/voucher";
import moment from "moment";
import { useAuth } from "contexts/AuthContext";
import { toastError } from "utils/toast";

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
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  // 2. KHỞI TẠO STATE RỖNG VÀ THÊM LOADING
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 3. DÙNG useEffect ĐỂ GỌI API KHI TRANG TẢI
  useEffect(() => {
    const fetchMyVouchers = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return; // Don't proceed until auth is initialized
      }

      // Check authentication
      if (!isAuthenticated || !user) {
        setError("Vui lòng đăng nhập để xem voucher của bạn");
        setIsLoading(false);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const vouchersData = await voucherAPI.getMyVouchers();
        
        // Check if vouchersData is valid
        if (!vouchersData || !Array.isArray(vouchersData)) {
          setVouchers([]);
          return;
        }
        
        // Filter: chỉ lấy voucher active và chưa hết hạn (bao gồm cả voucher sắp bắt đầu)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset về đầu ngày để so sánh chính xác
        
        const activeVouchers = vouchersData.filter(v => {
          // Check isActive field (đã được normalize từ status trong voucher.ts)
          if (!v.isActive) return false;
          
          // So sánh ngày (bỏ qua giờ/phút/giây)
          const endDate = new Date(v.endDate);
          endDate.setHours(0, 0, 0, 0);
          
          // Chỉ loại bỏ voucher đã hết hạn, giữ lại cả voucher sắp bắt đầu
          return endDate >= now;
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
      
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || "Không thể tải voucher. Vui lòng thử lại sau.";
        setError(errorMsg);
        toastError(errorMsg);
        setVouchers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyVouchers();
  }, [user, isAuthenticated, authLoading, navigate]); // Re-run when auth state changes

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      
      {/* --- Tiêu đề trang --- */}
      <div className="max-w-7xl mx-auto mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Ví Voucher Của Bạn
          {!authLoading && !isLoading && (
            <span className="ml-3 text-lg font-normal text-blue-600">
              ({vouchers.length} voucher có sẵn)
            </span>
          )}
        </h2>
        <p className="text-gray-600">Những voucher có sẵn để bạn sử dụng.</p>
      </div>

      {/* --- 4. XỬ LÝ TRẠNG THÁI LOADING VÀ RỖNG --- */}
      {authLoading || isLoading ? (
        <div className="max-w-7xl mx-auto text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? "Đang kiểm tra đăng nhập..." : "Đang tải voucher..."}
          </p>
        </div>
      ) : error ? (
        <div className="max-w-7xl mx-auto text-center py-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-800 font-semibold mb-2">Lỗi</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-10">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-gray-600 text-lg">Bạn chưa có voucher nào.</p>
            <Link 
              to="/listing-stay"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
              Khám phá condotel
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} />
            ))}
          </div>
          
          {/* Pagination */}
          {Math.ceil(vouchers.length / itemsPerPage) > 1 && (
            <div className="max-w-7xl mx-auto mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                ← Trang trước
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.ceil(vouchers.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(vouchers.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(vouchers.length / itemsPerPage)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Trang sau →
              </button>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

export default PageMyVouchers;