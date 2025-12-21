import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bookingAPI, { BookingDTO } from "api/booking";

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
    const date = new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00"));
    return date.toLocaleDateString("vi-VN");
  } catch {
    return dateString;
  }
};

// Map status từ backend sang tiếng Việt
const mapStatusToVN = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "Đã xác nhận";
    case "pending":
      return "Đang xử lý";
    case "cancelled":
      return "Đã hủy";
    case "completed":
      return "Hoàn thành";
    default:
      return status || "Đang xử lý";
  }
};

// Component Badge cho Trạng thái
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusVN = mapStatusToVN(status);
  let colorClasses = "";
  switch (status?.toLowerCase()) {
    case "confirmed":
    case "completed":
      colorClasses = "bg-green-100 text-green-700";
      break;
    case "pending":
      colorClasses = "bg-blue-100 text-blue-700";
      break;
    case "cancelled":
      colorClasses = "bg-red-100 text-red-700";
      break;
    default:
      colorClasses = "bg-blue-100 text-blue-700";
  }
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClasses}`}
    >
      {statusVN}
    </span>
  );
};

// --- Component Trang Lịch sử Booking (Tenant) ---
const PageBookingHistory = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await bookingAPI.getMyBookings();
        setBookings(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải danh sách đặt phòng");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Hàm xử lý click vào row
  const handleRowClick = (bookingId: number) => {
    navigate(`/booking-history/${bookingId}`);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">

      {/* --- Header --- */}
      <header className="max-w-7xl mx-auto mb-6 flex justify-between items-center py-4">
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
          Lịch sử đặt phòng
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">Customer</span>
          <button className="w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors">
            <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform"></div>
          </button>
        </div>
      </header>

      {/* --- Main Content Card --- */}
      <div className="max-w-7xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl">

        {/* --- Tiêu đề và Sắp xếp --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0 whitespace-nowrap">
            Danh sách
          </h2>
          <select className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Sắp xếp theo: Mới nhất</option>
            <option>Ngày cũ nhất</option>
          </select>
        </div>

        {/* --- Bảng Dữ liệu --- */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Thử lại
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Bạn chưa có đặt phòng nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ảnh</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên căn hộ</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày đặt phòng</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking, index) => (
                  <tr
                    key={booking.bookingId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(booking.bookingId)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                      <img 
                        src={booking.condotelImageUrl || ""}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }} 
                        alt={booking.condotelName || "Căn hộ"} 
                        className="w-24 h-16 object-cover rounded-lg shadow-sm" 
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 align-middle">
                      {booking.condotelName || `Căn hộ #${booking.condotelId}`}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 align-middle">
                      {formatDate(booking.createdAt)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 align-middle">
                      {formatPrice(booking.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Phân trang (Pagination) --- */}
        {bookings.length > 0 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Hiển thị {bookings.length} đặt phòng
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageBookingHistory;