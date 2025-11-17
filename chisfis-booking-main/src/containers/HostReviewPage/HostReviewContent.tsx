import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { reviewAPI, ReviewDTO } from "api/review";
import StartRating from "components/StartRating/StartRating";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import Input from "shared/Input/Input";

const HostReviewContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportingId, setReportingId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is Host
    if (!isAuthenticated || user?.roleName !== "Host") {
      navigate("/");
      return;
    }
    loadReviews();
  }, [isAuthenticated, user, navigate]);

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const reviewsData = await reviewAPI.getHostReviews();
      setReviews(reviewsData);
    } catch (err: any) {
      console.error("Failed to load reviews:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tải danh sách reviews"
      );
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: number) => {
    if (!replyText.trim()) {
      alert("Vui lòng nhập nội dung trả lời");
      return;
    }

    try {
      await reviewAPI.replyToReview(reviewId, replyText.trim());
      alert("Đã trả lời review thành công!");
      setReplyingId(null);
      setReplyText("");
      await loadReviews(); // Reload để cập nhật reply
    } catch (err: any) {
      console.error("Failed to reply review:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Không thể trả lời review. Vui lòng thử lại."
      );
    }
  };

  const handleReport = async (reviewId: number) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn báo cáo review này? Review sẽ được gửi đến admin để xem xét."
      )
    ) {
      return;
    }

    setReportingId(reviewId);
    try {
      await reviewAPI.reportReview(reviewId);
      alert("Đã báo cáo review thành công!");
      await loadReviews(); // Reload để cập nhật status
    } catch (err: any) {
      console.error("Failed to report review:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Không thể báo cáo review. Vui lòng thử lại."
      );
    } finally {
      setReportingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="nc-HostReviewContent" data-nc-id="HostReviewContent">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Quản lý Reviews
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Xem và trả lời các reviews về condotel của bạn
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={loadReviews}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !loading ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
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
          <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Chưa có reviews
          </h3>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Hiện tại chưa có review nào cho condotel của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.reviewId}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {review.customerImageUrl ? (
                      <img
                        src={review.customerImageUrl}
                        alt={review.customerName || "Customer"}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                        {(review.customerName || "C").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {review.customerName || "Khách hàng"}
                        </span>
                        <StartRating
                          point={review.rating}
                          className="flex items-center"
                          reviewCount={0}
                        />
                      </div>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>

                  {review.title && (
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      {review.title}
                    </h3>
                  )}

                  {review.comment && (
                    <p className="text-neutral-700 dark:text-neutral-300 mb-3">
                      {review.comment}
                    </p>
                  )}

                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Booking ID: {review.bookingId}
                  </div>
                </div>
              </div>

              {/* Reply Section */}
              {replyingId === review.reviewId ? (
                <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Trả lời review:
                  </label>
                  <Input
                    as="textarea"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="mb-3"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <ButtonPrimary
                      onClick={() => handleReply(review.reviewId!)}
                      className="text-sm"
                    >
                      Gửi trả lời
                    </ButtonPrimary>
                    <ButtonSecondary
                      onClick={() => {
                        setReplyingId(null);
                        setReplyText("");
                      }}
                      className="text-sm"
                    >
                      Hủy
                    </ButtonSecondary>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <ButtonPrimary
                    onClick={() => {
                      setReplyingId(review.reviewId!);
                      setReplyText("");
                    }}
                    className="text-sm"
                  >
                    Trả lời
                  </ButtonPrimary>
                  <ButtonSecondary
                    onClick={() => handleReport(review.reviewId!)}
                    disabled={reportingId === review.reviewId}
                    className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
                  >
                    {reportingId === review.reviewId ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Đang báo cáo...
                      </span>
                    ) : (
                      "Báo cáo Review"
                    )}
                  </ButtonSecondary>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostReviewContent;





