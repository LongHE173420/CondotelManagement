import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

// --- Định nghĩa kiểu dữ liệu ---
type BookingStatus = "Thành công" | "Đang xử lý" | "Thất bại";

interface BookingDetail {
  id: string;
  bookingId: string; // Mã đặt phòng
  status: BookingStatus;
  bookingDate: string; // Ngày đặt
  checkInDate: string;
  checkOutDate: string;
  apartmentName: string;
  apartmentAddress: string;
  apartmentImageUrl: string;
  apartmentId: string; // Để link về trang chi tiết căn hộ
  guests: {
    adults: number;
    children: number;
  };
  pricePerNight: number;
  serviceFee: number;
  totalNights: number;
  totalPrice: number;
}

// --- Dữ liệu mẫu (Mock Data) ---
const mockBookingDetail: BookingDetail = {
  id: "1",
  bookingId: "BOOK-A1B2C3",
  status: "Thành công",
  bookingDate: "01/10/2025",
  checkInDate: "15/10/2025",
  checkOutDate: "18/10/2025",
  apartmentName: "Mường Thanh Sea View",
  apartmentAddress: "Quận 1, TP. Hồ Chí Minh",
  apartmentImageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
  apartmentId: "123", // ID của căn hộ
  guests: {
    adults: 2,
    children: 1,
  },
  pricePerNight: 2300000,
  serviceFee: 150000,
  totalNights: 3,
  totalPrice: 7050000, // (2.3m * 3) + 150k
};

// --- [TÁI SỬ DỤNG] Component Badge cho Trạng thái ---
const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  let colorClasses = "";
  switch (status) {
    case "Thành công":
      colorClasses = "bg-green-100 text-green-700";
      break;
    case "Đang xử lý":
      colorClasses = "bg-blue-100 text-blue-700";
      break;
    case "Thất bại":
      colorClasses = "bg-red-100 text-red-700";
      break;
  }
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClasses}`}
    >
      {status}
    </span>
  );
};

// --- Component Trang Chi tiết Lịch sử Booking ---
const PageBookingHistoryDetail = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const [booking, setBooking] = useState<BookingDetail | null>(null);

  // Giả lập fetch dữ liệu
  useEffect(() => {
    // TODO: Dùng `id` để gọi API fetch chi tiết booking
    console.log("Fetching booking detail for ID:", id);
    setBooking(mockBookingDetail);
  }, [id]);

  if (!booking) {
    return <div className="p-8">Đang tải chi tiết...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
              Chi tiết đặt phòng
            </h1>
            <p className="text-gray-500">
              Đây là thông tin cho đơn đặt phòng{" "}
              <span className="font-medium text-gray-900">#{booking.bookingId}</span>
            </p>
          </div>
          <Link
            to="/booking-history" // Nút quay lại trang danh sách
            className="px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-200"
          >
            &larr; Quay lại danh sách
          </Link>
        </header>

        {/* --- Card Nội dung chính --- */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            
            {/* Cột Trái: Thông tin Booking */}
            <div className="md:col-span-2 p-6 border-r border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thông tin đơn
              </h2>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                  <dd className="text-sm font-semibold">
                    <StatusBadge status={booking.status} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Ngày đặt</dt>
                  <dd className="text-sm text-gray-700">{booking.bookingDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Nhận phòng</dt>
                  <dd className="text-sm text-gray-700">{booking.checkInDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Trả phòng</dt>
                  <dd className="text-sm text-gray-700">{booking.checkOutDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Số lượng khách</dt>
                  <dd className="text-sm text-gray-700">
                    {booking.guests.adults} Người lớn
                    {booking.guests.children > 0 && `, ${booking.guests.children} Trẻ em`}
                  </dd>
                </div>
              </dl>

              {/* Chi tiết thanh toán */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Chi tiết thanh toán
                </h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">
                      {booking.pricePerNight.toLocaleString("vi-VN")} VNĐ x {booking.totalNights} đêm
                    </dt>
                    <dd className="text-sm text-gray-700">
                      {(booking.pricePerNight * booking.totalNights).toLocaleString("vi-VN")} VNĐ
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Phí dịch vụ</dt>
                    <dd className="text-sm text-gray-700">
                      {booking.serviceFee.toLocaleString("vi-VN")} VNĐ
                    </dd>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-200">
                    <dt>Tổng cộng</dt>
                    <dd>{booking.totalPrice.toLocaleString("vi-VN")} VNĐ</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Cột Phải: Thông tin Căn hộ */}
            <div className="md:col-span-1 p-6 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thông tin căn hộ
              </h2>
              <img 
                src={booking.apartmentImageUrl} 
                alt={booking.apartmentName}
                className="w-full h-40 object-cover rounded-lg shadow-md mb-4" 
              />
              <h3 className="font-semibold text-gray-900">{booking.apartmentName}</h3>
              <p className="text-sm text-gray-600 mb-4">{booking.apartmentAddress}</p>
              
              <Link
                to={`/listing-stay-detail/${booking.apartmentId}`} // Link về trang chi tiết căn hộ
                className="w-full text-center block px-4 py-2 border border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 text-sm transition-colors"
              >
                Xem căn hộ
              </Link>

              {/* ✨ BẮT ĐẦU THÊM MỚI ✨ */}
              {/* Chỉ hiển thị nút khi booking đã thành công */}
              {booking.status === "Thành công" && (
                <Link
                  to={`/write-review/${booking.id}`}
                  className="w-full text-center block px-4 py-2 mt-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm transition-colors"
                >
                  Viết đánh giá
                </Link>
              )}
              {/* ✨ KẾT THÚC THÊM MỚI ✨ */}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageBookingHistoryDetail;