import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import bookingAPI, { BookingDTO } from "api/booking";
import condotelAPI, { CondotelDetailDTO } from "api/condotel";
import reviewAPI from "api/review";

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
  const date = new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00"));
  return date.toLocaleDateString("vi-VN");
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

// Component Trang Chi tiết Lịch sử Booking
const PageBookingHistoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [condotel, setCondotel] = useState<CondotelDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Fetch booking và condotel details
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Booking ID không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fetch booking detail
        const bookingData = await bookingAPI.getBookingById(parseInt(id));
        setBooking(bookingData);

        // Fetch condotel detail
        if (bookingData.condotelId) {
          try {
            const condotelData = await condotelAPI.getById(bookingData.condotelId);
            setCondotel(condotelData);
          } catch (err: any) {
            console.error("Error fetching condotel:", err);
            // Không set error nếu không fetch được condotel, chỉ log
          }
        }

        // Check if can review - CHỈ cho phép khi booking status là "Completed"
        // Backend đã xóa endpoint can-review, logic kiểm tra được tích hợp vào CreateReview
        // Ở đây chỉ cần kiểm tra booking status là "Completed"
        // Nếu đã review rồi, backend sẽ trả về lỗi khi submit review
        const bookingStatus = bookingData.status?.toLowerCase();
        if (bookingStatus === "completed") {
          setCanReview(true);
        } else {
          // Nếu booking chưa completed, không thể review
          // Chỉ booking với status "Completed" mới được phép review
          setCanReview(false);
          console.log(`Booking status is "${bookingData.status}", not "Completed". Cannot review.`);
        }
      } catch (err: any) {
        console.error("Error fetching booking detail:", err);
        setError("Không thể tải chi tiết đặt phòng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Tính số đêm
  const calculateNights = (): number => {
    if (!booking?.startDate || !booking?.endDate) return 0;
    const start = new Date(booking.startDate + "T00:00:00");
    const end = new Date(booking.endDate + "T00:00:00");
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Kiểm tra xem booking có thể hủy không
  const canCancel = (): boolean => {
    if (!booking) return false;
    const status = booking.status?.toLowerCase();
    return status === "pending" || status === "confirmed";
  };

  // Kiểm tra xem booking có thể hoàn tiền không (hủy trong vòng 2 ngày)
  const canRefund = (): boolean => {
    if (!booking || booking.status?.toLowerCase() !== "cancelled") {
      return false;
    }
    
    // Tính số ngày từ khi tạo booking đến hiện tại
    if (!booking.createdAt) return false;
    const createdDate = new Date(booking.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Nếu hủy trong vòng 2 ngày (từ ngày tạo booking)
    return diffDays <= 2;
  };

  // Xử lý hủy booking
  const handleCancel = async () => {
    if (!booking) return;
    
    if (!window.confirm("Bạn có chắc chắn muốn hủy đặt phòng này? Nếu hủy trong vòng 2 ngày, bạn có thể yêu cầu hoàn tiền.")) {
      return;
    }

    setCancelling(true);
    try {
      const createdAt = booking.createdAt;
      await bookingAPI.cancelBooking(booking.bookingId);
      
      // Kiểm tra xem có trong vòng 2 ngày không để tự động chuyển đến trang refund
      if (createdAt) {
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 2) {
          // Nếu hủy trong vòng 2 ngày, tự động chuyển đến trang nhập thông tin hoàn tiền
          if (window.confirm("Đã hủy đặt phòng thành công! Bạn có muốn điền thông tin để yêu cầu hoàn tiền ngay bây giờ không?")) {
            navigate(`/request-refund/${booking.bookingId}`);
            return; // Không reload, vì sẽ navigate đi
          }
        }
      }
      
      alert("Đã hủy đặt phòng thành công. Nếu hủy trong vòng 2 ngày, bạn có thể yêu cầu hoàn tiền.");
      
      // Reload booking để cập nhật trạng thái
      const updatedBooking = await bookingAPI.getBookingById(booking.bookingId);
      setBooking(updatedBooking);
    } catch (err: any) {
      console.error("Error cancelling booking:", err);
      alert(
        err.response?.data?.message || 
        err.message || 
        "Không thể hủy đặt phòng. Vui lòng thử lại sau."
      );
    } finally {
      setCancelling(false);
    }
  };

  // Navigate to refund form
  const handleRefund = () => {
    if (!booking || !canRefund()) return;
    navigate(`/request-refund/${booking.bookingId}`);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Đang tải chi tiết...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || "Không tìm thấy đặt phòng"}</p>
        <Link
          to="/my-bookings"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
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
            to="/my-bookings"
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
                
                {/* Nút hủy booking - chỉ hiển thị khi booking có thể hủy */}
                {canCancel() && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {cancelling ? "Đang hủy..." : "❌ Hủy đặt phòng"}
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      * Nếu hủy trong vòng 2 ngày, bạn có thể yêu cầu hoàn tiền
                    </p>
                  </div>
                )}
                
                {/* Nút yêu cầu hoàn tiền - chỉ hiển thị khi booking bị hủy trong vòng 2 ngày */}
                {canRefund() && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleRefund}
                      className="w-full px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      💰 Yêu cầu hoàn tiền
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      * Booking bị hủy trong vòng 2 ngày có thể yêu cầu hoàn tiền
                    </p>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Ngày đặt</dt>
                  <dd className="text-sm text-gray-700">{formatDate(booking.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Nhận phòng</dt>
                  <dd className="text-sm text-gray-700">{formatDate(booking.startDate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Trả phòng</dt>
                  <dd className="text-sm text-gray-700">{formatDate(booking.endDate)}</dd>
                </div>
              </dl>

              {/* Chi tiết thanh toán */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Chi tiết thanh toán
                </h3>
                <dl className="space-y-3">
                  {condotel && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">
                        {formatPrice(condotel.pricePerNight)} x {calculateNights()} đêm
                      </dt>
                      <dd className="text-sm text-gray-700">
                        {formatPrice((condotel.pricePerNight || 0) * calculateNights())}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-200">
                    <dt>Tổng cộng</dt>
                    <dd>{formatPrice(booking.totalPrice)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Cột Phải: Thông tin Căn hộ */}
            <div className="md:col-span-1 p-6 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Thông tin căn hộ
              </h2>
              {condotel ? (
                <>
                  <img 
                    src={condotel.images?.[0]?.imageUrl || booking.condotelImageUrl || "https://via.placeholder.com/400?text=No+Image"} 
                    alt={condotel.name}
                    className="w-full h-40 object-cover rounded-lg shadow-md mb-4" 
                  />
                  <h3 className="font-semibold text-gray-900 mb-2">{condotel.name}</h3>
                  {condotel.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-3">{condotel.description}</p>
                  )}
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Phòng ngủ: {condotel.beds}</p>
                    <p>Phòng tắm: {condotel.bathrooms}</p>
                    <p>Giá/đêm: {formatPrice(condotel.pricePerNight)}</p>
                  </div>
                  
                  <Link
                    to={`/listing-stay-detail/${condotel.condotelId}`}
                    className="w-full text-center block px-4 py-2 border border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 text-sm transition-colors mb-3"
                  >
                    Xem chi tiết căn hộ
                  </Link>

                  {/* Nút viết đánh giá - chỉ hiển thị khi booking completed và có thể review */}
                  {booking.status?.toLowerCase() === "completed" && canReview && (
                    <Link
                      to={`/write-review/${booking.bookingId}`}
                      className="w-full text-center block px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm transition-colors"
                    >
                      Viết đánh giá
                    </Link>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <p>Đang tải thông tin căn hộ...</p>
                  {booking.condotelId && (
                    <Link
                      to={`/listing-stay-detail/${booking.condotelId}`}
                      className="mt-4 inline-block px-4 py-2 border border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 text-sm transition-colors"
                    >
                      Xem chi tiết căn hộ
                    </Link>
                  )}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageBookingHistoryDetail;