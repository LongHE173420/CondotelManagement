import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import reviewAPI, { ReviewDTO } from "api/review";
import { toast } from "react-toastify";

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

// Component Star Rating
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex text-yellow-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? "fill-current" : "fill-none"}`}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const PageMyReviews: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await reviewAPI.getMyReviews();
        setReviews(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải danh sách đánh giá");
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const handleDelete = async (reviewId: number) => {
    toast.info("Xóa đánh giá?", {
      position: "bottom-center",
      autoClose: false,
      closeButton: true,
    });

    try {
      await reviewAPI.deleteReview(reviewId);
      // Reload reviews
      setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
      toast.success("✅ Đã xóa đánh giá thành công!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Không thể xóa đánh giá";
      toast.error(`❌ ${errorMsg}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Đang tải đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button
              onClick={() => navigate("/account")}
              className="hover:text-gray-900"
            >
              Tài khoản
            </button>
            <span>/</span>
            <span className="text-gray-900">Đánh giá của tôi</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Đánh giá của tôi</h1>
          <p className="text-gray-600 mt-2">
            Quản lý tất cả các đánh giá bạn đã viết
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
            {error}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Bạn chưa có đánh giá nào
            </h3>
            <p className="text-gray-600 mb-6">
              Hãy đặt phòng và trải nghiệm để viết đánh giá đầu tiên!
            </p>
            <Link
              to="/listing-stay"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Khám phá căn hộ
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              return (
                <div
                  key={review.reviewId}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {/* Hiển thị tên người review và căn hộ */}
                      <div className="flex items-center gap-3 mb-3">
                        {review.customerImageUrl || review.userImageUrl ? (
                          <img
                            src={review.customerImageUrl || review.userImageUrl}
                            alt={review.customerName || review.userFullName || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              // Nếu ảnh lỗi, thay bằng avatar mặc định
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        {(!review.customerImageUrl && !review.userImageUrl) && (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-sm">
                              {(review.customerName || review.userFullName || "U")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {review.customerName || review.userFullName || "Người dùng"}
                          </div>
                          {review.condotelName && review.condotelId && (
                            <div className="text-sm text-gray-600">
                              Đánh giá cho:{" "}
                              <Link
                                to={`/listing-stay-detail/${review.condotelId}`}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                              >
                                {review.condotelName}
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {review.title}
                        </h3>
                      )}
                      {review.comment && (
                        <p className="text-gray-700 mb-4">{review.comment}</p>
                      )}
                      {/* Hiển thị reply nếu có */}
                      {review.reply && (
                        <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 rounded-r-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                              Phản hồi từ Host:
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {review.reply}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {review.reviewId && (
                        <button
                          onClick={() => handleDelete(review.reviewId!)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa đánh giá"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Review count */}
        {reviews.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Tổng cộng {reviews.length} đánh giá
          </div>
        )}
      </div>
    </div>
  );
};

export default PageMyReviews;


