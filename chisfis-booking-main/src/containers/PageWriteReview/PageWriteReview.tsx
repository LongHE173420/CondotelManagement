import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import reviewAPI from "api/review";
import bookingAPI, { BookingDTO } from "api/booking";
import { useAuth } from "contexts/AuthContext";
import { validateBookingOwnership } from "utils/bookingSecurity";
import { toast } from "react-toastify";

// Component Star (để chọn 1-5 sao)
const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          onClick={() => setRating(star)}
          className={`w-10 h-10 cursor-pointer ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Component chính của trang viết Review
const PageWriteReview = () => {
  const { id } = useParams(); // ID này là ID của ĐƠN ĐẶT PHÒNG (bookingId)
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Check if can review và fetch booking info
  useEffect(() => {
    const checkCanReview = async () => {
      if (!id) {
        setError("Booking ID không hợp lệ");
        setChecking(false);
        return;
      }

      // Check authentication first
      if (!isAuthenticated || !user) {
        setError("Vui lòng đăng nhập để viết đánh giá");
        setUnauthorized(true);
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        // Fetch booking để hiển thị thông tin
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

        // Kiểm tra booking status phải là "Completed" trước
        const bookingStatus = bookingData.status?.toLowerCase();
        if (bookingStatus !== "completed") {
          setCanReview(false);
          let statusMessage = "";
          switch (bookingStatus) {
            case "pending":
              statusMessage = "Đơn đặt phòng đang chờ xử lý. Chỉ có thể đánh giá sau khi đơn đặt phòng hoàn thành.";
              break;
            case "confirmed":
              statusMessage = "Đơn đặt phòng đã được xác nhận nhưng chưa hoàn thành. Chỉ có thể đánh giá sau khi đơn đặt phòng hoàn thành.";
              break;
            case "cancelled":
              statusMessage = "Đơn đặt phòng đã bị hủy. Không thể đánh giá đơn đặt phòng đã hủy.";
              break;
            default:
              statusMessage = `Đơn đặt phòng có trạng thái "${bookingData.status}". Chỉ có thể đánh giá khi đơn đặt phòng đã hoàn thành (Completed).`;
          }
          setError(statusMessage);
          setChecking(false);
          return;
        }

        // Backend đã xóa endpoint can-review, logic kiểm tra được tích hợp vào CreateReview
        // Ở đây chỉ cần kiểm tra booking status là "Completed"
        // Nếu đã review rồi hoặc không đủ điều kiện, backend sẽ trả về lỗi khi submit review
        setCanReview(true);
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError("Bạn không có quyền truy cập booking này");
          setUnauthorized(true);
        } else {
          setError("Không thể kiểm tra quyền đánh giá. Vui lòng thử lại sau.");
        }
      } finally {
        setChecking(false);
      }
    };

    checkCanReview();
  }, [id, user, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("❌ Vui lòng chọn số sao đánh giá (từ 1-5 sao).");
      return;
    }

    if (!id) {
      toast.error("❌ Booking ID không hợp lệ.");
      return;
    }

    // Kiểm tra lại canReview trước khi submit (double check)
    if (!canReview) {
      setError("Bạn không thể đánh giá đơn đặt phòng này. Vui lòng kiểm tra lại.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Backend sẽ kiểm tra lại: user phải là customer của booking, booking phải completed, chưa review
      await reviewAPI.createReview({
        bookingId: parseInt(id),
        rating: rating,
        title: title || undefined,
        comment: reviewText || undefined,
      });

      toast.success("🎉 Cảm ơn bạn đã đánh giá!");
      navigate(`/my-bookings`);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || "Không thể gửi đánh giá. Vui lòng thử lại sau.";
      toast.error(`❌ ${message}`);
      setError(message);
      
      // Nếu lỗi là do không đủ điều kiện (400), có thể là đã review rồi hoặc không phải customer
      if (err.response?.status === 400) {
        setCanReview(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Đang kiểm tra...</p>
      </div>
    );
  }

  if (!canReview || error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || "Bạn không thể đánh giá đơn đặt phòng này."}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit}>
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight text-center">
            Đánh giá của bạn
          </h1>
          <p className="text-gray-500 text-center mt-2 mb-6">
            {booking ? (
              <>Bạn đang đánh giá cho đơn đặt phòng #{booking.bookingId}</>
            ) : (
              <>Bạn đang đánh giá cho đơn đặt phòng #{id}</>
            )}
          </p>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">1. Bạn đánh giá bao nhiêu sao?</h2>
            <div className="flex justify-center">
              <StarRating rating={rating} setRating={setRating} />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="title" className="block text-lg font-semibold text-gray-700 mb-3">
              2. Tiêu đề đánh giá (tùy chọn)
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: Căn hộ tuyệt vời!"
              maxLength={100}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="reviewText" className="block text-lg font-semibold text-gray-700 mb-3">
              3. Viết nhận xét của bạn
            </label>
            <textarea
              id="reviewText"
              rows={6}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Căn hộ này thế nào? Dịch vụ ra sao? Hãy chia sẻ trải nghiệm của bạn..."
            ></textarea>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)} // Nút Hủy, quay lại trang trước
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageWriteReview;