import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import bookingAPI, { BookingDTO } from "api/booking";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { useAuth } from "contexts/AuthContext";
import { validateBookingOwnership } from "utils/bookingSecurity";
import { toast } from "react-toastify";

// Danh sách ngân hàng phổ biến ở Việt Nam
const BANKS = [
  { code: "VCB", name: "Vietcombank" },
  { code: "MB", name: "MBBank" },
  { code: "TCB", name: "Techcombank" },
  { code: "ACB", name: "ACB" },
  { code: "BIDV", name: "BIDV" },
  { code: "VTB", name: "VietinBank" },
  { code: "TPB", name: "TPBank" },
  { code: "VPB", name: "VPBank" },
  { code: "MSB", name: "MSB" },
  { code: "HDB", name: "HDBank" },
  { code: "SHB", name: "SHB" },
  { code: "VIB", name: "VIB" },
  { code: "OCB", name: "OCB" },
  { code: "SCB", name: "SCB" },
  { code: "EXIM", name: "Eximbank" },
];

const PageRequestRefund = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  useEffect(() => {
    const loadBooking = async () => {
      if (!id) {
        setError("Không tìm thấy ID booking");
        setLoading(false);
        return;
      }

      // Check authentication first
      if (!isAuthenticated || !user) {
        setError("Vui lòng đăng nhập để xem thông tin booking");
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const bookingData = await bookingAPI.getBookingById(parseInt(id));
        
        // SECURITY CHECK: Verify user owns this booking
        try {
          validateBookingOwnership(bookingData, user);
          setBooking(bookingData);
          setUnauthorized(false);
        } catch (securityError: any) {
          setError(securityError.message || "Bạn không có quyền truy cập booking này");
          setUnauthorized(true);
          setBooking(null);
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate("/");
          }, 3000);
          return;
        }

        // Kiểm tra điều kiện hoàn tiền
        const status = bookingData.status?.toLowerCase()?.trim();
        
        // Phân biệt Cancel Payment vs Cancel Booking:
        // - Cancel Payment: Booking chưa thanh toán (status = "Cancelled" và totalPrice = 0/null) → KHÔNG refund
        // - Cancel Booking: Booking đã thanh toán (status = "Cancelled" và totalPrice > 0) → CÓ refund
        
        // Kiểm tra nếu là Cancel Payment (không có giá)
        const isCancelPayment = status === "cancelled" && (!bookingData.totalPrice || bookingData.totalPrice === 0);
        
        if (isCancelPayment) {
          setError("Booking này đã bị hủy thanh toán (chưa thanh toán). Không thể yêu cầu hoàn tiền cho booking chưa thanh toán.");
        } else {
          // Backend cho phép tạo refund request cho booking có status:
          // - "Cancelled" (đã hủy SAU KHI ĐÃ THANH TOÁN - có totalPrice > 0)
          // - "Confirmed" (có thể hủy)
          // - "Completed" (có thể hoàn tiền)
          // - "Refunded" (nếu chưa có refund request completed - backend sẽ kiểm tra)
          // Backend sẽ tự động kiểm tra xem đã có RefundRequest với status "Completed"/"Refunded" chưa
          const canRequestRefund = status === "cancelled" || 
                                    status === "pending" || 
                                    status === "confirmed" ||
                                    status === "completed" ||
                                    status === "refunded"; // Backend sẽ kiểm tra xem đã có refund request chưa
          
          if (!canRequestRefund) {
            setError(`Booking đang ở trạng thái "${bookingData.status}" không thể hoàn tiền. Chỉ có thể hoàn tiền cho booking đã bị hủy SAU KHI ĐÃ THANH TOÁN (Cancelled với totalPrice > 0) hoặc đang ở trạng thái Pending/Confirmed/Completed/Refunded (nếu chưa có refund request completed).`);
          } else {
            // Kiểm tra xem có trong vòng 2 ngày không
            if (bookingData.createdAt) {
              const createdDate = new Date(bookingData.createdAt);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - createdDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays > 2) {
                setError("Chỉ có thể yêu cầu hoàn tiền trong vòng 2 ngày kể từ ngày đặt phòng");
              }
            }
          }
        }
      } catch (err: any) {
        setError("Không thể tải thông tin booking. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("❌ Vui lòng điền đầy đủ thông tin ngân hàng");
      return;
    }

    if (!booking) return;

    setSubmitting(true);
    setError("");
    setSuccess(false);
    setSuccessMessage("");

    try {
      let currentBooking = await bookingAPI.getBookingById(booking.bookingId);

      if (!currentBooking) {
        throw new Error("Không thể tải thông tin booking. Vui lòng thử lại sau.");
      }

      const status = currentBooking.status?.toLowerCase()?.trim();
      const statusOriginal = currentBooking.status; // Giữ nguyên case để hiển thị
      
      // Backend cho phép tạo refund request cho các status:
      // - "Cancelled" (đã hủy)
      // - "Refunded" (nếu chưa có refund request completed - backend sẽ kiểm tra)
      // - "Confirmed", "Completed" (có thể hủy)
      // Backend sẽ tự động kiểm tra xem đã có RefundRequest với status "Completed"/"Refunded" chưa
      const isRefundedStatus = status === "refunded";
      const isCancelledStatus = status === "cancelled";
      const isCompletedStatus = status === "completed";
      
      // Nếu status là "Refunded", backend sẽ kiểm tra xem đã có refund request completed chưa
      // Nếu chưa có, backend sẽ cho phép tạo refund request mới
      const isAlreadyCancelledOrRefunded = isCancelledStatus || isRefundedStatus || isCompletedStatus;
      
      // Nếu booking chưa hủy hoặc chưa ở trạng thái có thể hoàn tiền, tự động hủy trước
      // Backend cho phép: Cancelled, Refunded (nếu chưa có refund completed), Completed, Confirmed, Pending
      if (!isAlreadyCancelledOrRefunded) {
        // Cho phép hủy nếu status là "pending" hoặc "confirmed" (case-insensitive, trim whitespace)
        const canCancel = status === "pending" || status === "confirmed";
        
        if (canCancel) {
          // Hủy booking trước
          try {
            await bookingAPI.cancelBooking(currentBooking.bookingId);
            
            // Reload booking để lấy status mới
            currentBooking = await bookingAPI.getBookingById(currentBooking.bookingId);
            const newStatus = currentBooking.status?.toLowerCase()?.trim();
            
            // Kiểm tra lại status sau khi hủy
            // Backend sẽ set status = "Cancelled" khi hủy booking
            // Nếu là "Refunded" hoặc "Completed", cũng chấp nhận (backend sẽ kiểm tra refund request)
            const validStatusAfterCancel = ["cancelled", "refunded", "completed"];
            if (!validStatusAfterCancel.includes(newStatus)) {
              throw new Error(`Booking chưa được hủy thành công. Trạng thái hiện tại: ${currentBooking.status}. Vui lòng thử lại sau.`);
            }
          } catch (cancelErr: any) {
            const errorMsg = cancelErr.response?.data?.message ||
              cancelErr.response?.data?.Message ||
              cancelErr.message ||
              "Không thể hủy booking. Vui lòng thử lại sau.";
            setError(errorMsg);
            setSubmitting(false);
            return;
          }
        } else {
          // Status không phải cancelled, refunded (tạm thời chấp nhận), pending, hoặc confirmed
          const errorMsg = `Booking đang ở trạng thái "${statusOriginal || 'Không xác định'}" không thể hủy hoặc hoàn tiền. Chỉ có thể hoàn tiền cho booking đã bị hủy (status = "Cancelled" hoặc "Refunded" nếu backend set sai) hoặc đang ở trạng thái Pending/Confirmed.`;
          setError(errorMsg);
          setSubmitting(false);
          return;
        }
        } else {
          // Booking đã ở trạng thái Cancelled/Refunded/Completed
          // Kiểm tra lại: Nếu là Cancelled nhưng không có giá → Cancel Payment → không refund
          if (isCancelledStatus && (!currentBooking.totalPrice || currentBooking.totalPrice === 0)) {
            const errorMsg = "Booking này đã bị hủy thanh toán (chưa thanh toán). Không thể yêu cầu hoàn tiền cho booking chưa thanh toán.";
            setError(errorMsg);
            setSubmitting(false);
            return;
          }
        }      if (!currentBooking.totalPrice || currentBooking.totalPrice <= 0) {
        throw new Error("Booking không có số tiền hợp lệ để hoàn tiền.");
      }

      const finalStatus = currentBooking.status?.toLowerCase()?.trim();
      const validStatuses = ["cancelled", "refunded", "completed", "confirmed", "pending"];
      
      if (!validStatuses.includes(finalStatus)) {
        throw new Error(`Booking không ở trạng thái hợp lệ để hoàn tiền. Trạng thái hiện tại: ${currentBooking.status}. Chỉ có thể hoàn tiền cho booking đã bị hủy (Cancelled) hoặc đang ở trạng thái Pending/Confirmed/Completed/Refunded (nếu chưa có refund request completed).`);
      }

      if (!currentBooking.totalPrice || currentBooking.totalPrice <= 0) {
        throw new Error("Booking không có số tiền hợp lệ để hoàn tiền.");
      }

      // console.log("💰 Đang gửi yêu cầu hoàn tiền với thông tin:", {
      //   bookingId: currentBooking.bookingId,
      //   status: currentBooking.status,
      //   totalPrice: currentBooking.totalPrice,
      //   bankName,
      //   accountNumber: accountNumber.substring(0, 3) + "***", // Ẩn thông tin nhạy cảm
      //   accountHolder: accountHolder.substring(0, 3) + "***", // Ẩn thông tin nhạy cảm
      // });

      const result = await bookingAPI.refundBooking(currentBooking.bookingId, {
        bankName,
        accountNumber,
        accountHolder,
      });

      if (result.success) {
        const successMsg = result.message || "Yêu cầu hoàn tiền đã được gửi thành công. Admin sẽ xử lý trong vòng 1-3 ngày làm việc.";
        
        // Parse bank info từ response (có thể là BankInfo hoặc bankInfo)
        const bankInfoFromResponse = result.bankInfo || result.data?.BankInfo || result.data?.bankInfo || null;
        
        setSuccess(true);
        setSuccessMessage(successMsg);
        
        // Tự động chuyển trang sau 2 giây
        setTimeout(() => {
          navigate("/my-bookings");
        }, 2000);
      } else {
        const errorMsg = result.message || "Không thể gửi yêu cầu hoàn tiền. Vui lòng thử lại sau.";
        setError(errorMsg);
      }
    } catch (err: any) {
      let errorMsg = "Đã có lỗi xảy ra khi gửi yêu cầu hoàn tiền. Vui lòng thử lại sau.";
      
      if (err.response?.data) {
        // Backend trả về lỗi có cấu trúc
        if (err.response.data.Message) {
          errorMsg = err.response.data.Message;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.title) {
          errorMsg = err.response.data.title;
        } else if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        }
        
        // Nếu có validation errors
        if (err.response.data.errors) {
          const validationErrors = Object.values(err.response.data.errors)
            .flat()
            .join(', ');
          errorMsg += `\n\nLỗi validation: ${validationErrors}`;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price?: number): string => {
    if (!price) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00"));
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/my-bookings" className="text-blue-600 hover:underline">
          Quay lại danh sách booking
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Không tìm thấy thông tin booking</p>
        <Link to="/my-bookings" className="text-blue-600 hover:underline">
          Quay lại danh sách booking
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yêu cầu Hoàn tiền</h1>
          <p className="text-gray-600">
            Điền thông tin tài khoản ngân hàng để nhận tiền hoàn cho booking #{booking.bookingId}
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
            <p className="text-green-600 text-sm mt-2">Đang chuyển đến trang danh sách booking...</p>
          </div>
        )}

        {/* Error message */}
        {error && !success && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            {booking && booking.status?.toLowerCase() !== "cancelled" && 
             (booking.status?.toLowerCase() === "pending" || booking.status?.toLowerCase() === "confirmed") && (
              <p className="text-blue-600 text-sm mt-2">
                * Lưu ý: Booking sẽ được tự động hủy khi bạn gửi yêu cầu hoàn tiền.
              </p>
            )}
          </div>
        )}

        {/* Booking Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin Booking</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Căn hộ:</span>
              <span className="font-medium">{booking.condotelName || `Condotel #${booking.condotelId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày đặt:</span>
              <span className="font-medium">{formatDate(booking.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in / Check-out:</span>
              <span className="font-medium">
                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-600 font-semibold">Số tiền hoàn:</span>
              <span className="text-2xl font-bold text-red-600">{formatPrice(booking.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Refund Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin Tài khoản Ngân hàng</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Info box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-700">
                Vui lòng cung cấp thông tin tài khoản ngân hàng để Admin chuyển khoản hoàn tiền cho bạn.
                Thời gian xử lý: 1-3 ngày làm việc.
              </p>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên Ngân hàng <span className="text-red-500">*</span>
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Chọn ngân hàng --</option>
                {BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name} ({bank.code})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Nếu ngân hàng của bạn không có trong danh sách, vui lòng nhập mã ngân hàng (VD: VCB, MB, TCB...)
              </p>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập số tài khoản..."
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Account Holder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên chủ tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VIET HOA KHONG DAU (VD: NGUYEN VAN A)"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Vui lòng nhập tên chủ tài khoản bằng chữ in hoa, không dấu
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <ButtonSecondary
                type="button"
                onClick={() => navigate("/my-bookings")}
                className="flex-1"
              >
                Hủy
              </ButtonSecondary>
              <ButtonPrimary
                type="submit"
                disabled={submitting || success}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : success ? (
                  <>
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Đã gửi thành công!
                  </>
                ) : (
                  "Gửi yêu cầu hoàn tiền"
                )}
              </ButtonPrimary>
            </div>
          </form>
        </div>

        {/* Policy Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ thông tin tài khoản trước khi gửi yêu cầu. 
            Nếu thông tin sai, việc hoàn tiền có thể bị trì hoãn hoặc thất bại.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageRequestRefund;

