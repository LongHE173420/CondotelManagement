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

// Component đếm ngược thời gian thanh toán
const PaymentCountdown: React.FC<{ createdAt: string; onTimeout: () => void }> = ({ createdAt, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(180); // 3 phút = 180 giây

  useEffect(() => {
    const createdTime = new Date(createdAt).getTime();
    const expiryTime = createdTime + (3 * 60 * 1000); // +3 phút

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onTimeout(); // Gọi callback khi hết giờ
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="payment-countdown">
      <p className="text-red-600 font-bold">
        Thời gian thanh toán còn lại: 
        <span className="text-2xl ml-2">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </p>
      {timeLeft === 0 && (
        <p className="text-red-500">
          Đã hết thời gian thanh toán. Vui lòng đặt phòng lại.
        </p>
      )}
    </div>
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
  const [unauthorized, setUnauthorized] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState("");

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

  // Xóa thông báo hết hạn khi booking status thay đổi (không còn pending)
  useEffect(() => {
    if (booking && booking.status?.toLowerCase() !== "pending" && expiredMessage) {
      setExpiredMessage("");
    }
  }, [booking?.status, expiredMessage]);

  // Tính số đêm
  const calculateNights = (): number => {
    if (!booking?.startDate || !booking?.endDate) return 0;
    const start = new Date(booking.startDate + "T00:00:00");
    const end = new Date(booking.endDate + "T00:00:00");
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Kiểm tra xem booking có còn trong thời gian thanh toán không (3 phút)
  const isWithinPaymentTime = (): boolean => {
    if (!booking?.createdAt) return false;
    const createdTime = new Date(booking.createdAt).getTime();
    const expiryTime = createdTime + (3 * 60 * 1000); // +3 phút
    const now = Date.now();
    return now < expiryTime;
  };

  // Kiểm tra xem booking có thể hủy không
  const canCancel = (): boolean => {
    if (!booking) return false;
    const status = booking.status?.toLowerCase();
    // Chỉ cho phép hủy nếu status là Confirmed (không cho phép hủy khi đang xử lý - Pending)
    return status === "confirmed";
  };

  // Kiểm tra xem booking có thể hoàn tiền không
  // Sử dụng field canRefund từ API response (Option 1)
  // Fallback về logic cũ nếu canRefund không có trong response
  const canRefund = (): boolean => {
    if (!booking) {
      return false;
    }
    
    // Chỉ cho phép yêu cầu hoàn tiền nếu:
    // 1. Booking status = "Cancelled"
    // 2. refundStatus = null (chưa có refund request)
    // 3. canRefund = true (từ backend)
    
    if (booking.status?.toLowerCase() !== "cancelled") {
      return false;
    }
    
    // Nếu đã có refund request (refundStatus không null), không cho phép tạo request mới
    if (booking.refundStatus !== null && booking.refundStatus !== undefined) {
      return false;
    }
    
    // Ưu tiên sử dụng field canRefund từ backend
    if (booking.canRefund !== undefined) {
      return booking.canRefund;
    }
    
    // Fallback: Logic cũ nếu backend chưa trả về canRefund
    // Phân biệt Cancel Payment vs Cancel Booking:
    // - Cancel Payment: Booking chưa thanh toán (status ban đầu = "Pending") → không refund
    // - Cancel Booking: Booking đã thanh toán (status ban đầu = "Confirmed" hoặc "Completed") → có refund
    
    // Kiểm tra xem booking có totalPrice > 0 (có thể đã thanh toán)
    // Nếu totalPrice = 0 hoặc null, có thể là booking chưa thanh toán → không refund
    const hasPrice = booking.totalPrice && booking.totalPrice > 0;
    
    // Nếu không có giá, có thể là cancel payment → không refund
    if (!hasPrice) {
      return false;
    }
    
    // Tính số ngày từ khi tạo booking đến hiện tại
    if (!booking.createdAt) return false;
    const createdDate = new Date(booking.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Nếu hủy trong vòng 2 ngày (từ ngày tạo booking) VÀ booking có giá (đã thanh toán)
    return diffDays <= 2;
  };

  // Xử lý tự động hủy booking khi hết thời gian thanh toán
  const handleAutoCancel = async () => {
    if (!booking) return;
    
    // Kiểm tra lại trạng thái booking trước khi hủy (tránh hủy nhiều lần)
    if (booking.status?.toLowerCase() !== "pending") {
      return;
    }

    setCancelling(true);
    try {
      await bookingAPI.cancelBooking(booking.bookingId);
      
      // Reload booking để cập nhật trạng thái
      const updatedBooking = await bookingAPI.getBookingById(booking.bookingId);
      setBooking(updatedBooking);
      
      // Hiển thị thông báo trên màn hình
      setExpiredMessage("Đã hết thời gian thanh toán. Đơn đặt phòng đã được tự động hủy.");
    } catch (err: any) {
      console.error("Error auto cancelling booking:", err);
      // Vẫn reload để kiểm tra trạng thái mới nhất
      try {
        const updatedBooking = await bookingAPI.getBookingById(booking.bookingId);
        setBooking(updatedBooking);
        setExpiredMessage("Đã hết thời gian thanh toán. Vui lòng kiểm tra lại trạng thái đơn đặt phòng.");
      } catch (reloadErr) {
        console.error("Error reloading booking:", reloadErr);
        setExpiredMessage("Đã hết thời gian thanh toán. Vui lòng làm mới trang để kiểm tra trạng thái.");
      }
    } finally {
      setCancelling(false);
    }
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

        {/* Thông báo hết thời gian thanh toán */}
        {expiredMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">
                  {expiredMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setExpiredMessage("")}
                  className="inline-flex text-red-500 hover:text-red-700 focus:outline-none"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

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
                
                {/* Hiển thị countdown khi booking ở trạng thái Pending và còn trong thời gian thanh toán */}
                {booking.status?.toLowerCase() === "pending" && booking.createdAt && isWithinPaymentTime() && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <PaymentCountdown 
                      createdAt={booking.createdAt} 
                      onTimeout={() => {
                        // Khi hết thời gian, tự động hủy booking
                        handleAutoCancel();
                      }} 
                    />
                  </div>
                )}
                
                {/* Nút thanh toán lại - chỉ hiển thị khi booking ở trạng thái Pending */}
                {booking.status?.toLowerCase() === "pending" && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/checkout?bookingId=${booking.bookingId}&retry=true`)}
                      className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      💳 Thanh toán lại
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      * Nếu thanh toán chưa thành công, bạn có thể thanh toán lại
                    </p>
                  </div>
                )}
                
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
                
                {/* Hiển thị refund status nếu booking đã bị hủy và có refund request */}
                {booking.status?.toLowerCase() === "cancelled" && booking.refundStatus && (
                  <div className={`mt-4 pt-4 border-t border-gray-200 rounded-lg p-3 ${
                    booking.refundStatus === "Pending" ? "bg-yellow-50 border-yellow-200" :
                    booking.refundStatus === "Refunded" || booking.refundStatus === "Completed" ? "bg-green-50 border-green-200" :
                    "bg-gray-50 border-gray-200"
                  }`}>
                    <p className={`text-sm font-medium ${
                      booking.refundStatus === "Pending" ? "text-yellow-800" :
                      booking.refundStatus === "Refunded" || booking.refundStatus === "Completed" ? "text-green-800" :
                      "text-gray-800"
                    }`}>
                      <strong>Trạng thái hoàn tiền:</strong> {
                        booking.refundStatus === "Pending" ? "Đang chờ hoàn tiền" :
                        booking.refundStatus === "Refunded" ? "Đã hoàn tiền thành công (PayOS)" :
                        booking.refundStatus === "Completed" ? "Đã hoàn tiền thủ công" :
                        booking.refundStatus
                      }
                    </p>
                  </div>
                )}
                
                {/* Nút yêu cầu hoàn tiền - chỉ hiển thị khi booking bị hủy trong vòng 2 ngày và chưa có refund request */}
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
                
                {/* Thông báo khi booking đang ở trạng thái Pending */}
                {booking.status?.toLowerCase() === "pending" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Booking đang ở trạng thái "{mapStatusToVN(booking.status)}". 
                      Hệ thống đang xác nhận thanh toán của bạn. 
                      Nếu bạn đã hoàn tất thanh toán, vui lòng đợi vài giây để hệ thống cập nhật trạng thái.
                    </p>
                  </div>
                )}
                
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
                  
                  {booking.promotionId && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Khuyến mãi</dt>
                      <dd className="text-sm text-green-600">Đã áp dụng</dd>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Phương thức thanh toán</dt>
                    <dd className="text-sm text-gray-700">PayOS</dd>
                  </div>
                  
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