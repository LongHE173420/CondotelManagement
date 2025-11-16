import React, { FC, useState, useEffect } from "react";
import { reviewAPI, ReportedReviewDTO } from "api/review";
import StartRating from "components/StartRating/StartRating";

const PageManageReviews: FC = () => {
  const [reportedReviews, setReportedReviews] = useState<ReportedReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadReportedReviews();
  }, []);

  const loadReportedReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const reviews = await reviewAPI.getReportedReviews();
      setReportedReviews(reviews);
    } catch (err: any) {
      console.error("Failed to load reported reviews:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tải danh sách review bị báo cáo"
      );
      setReportedReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa review này?")) {
      return;
    }

    try {
      setDeletingId(reviewId);
      await reviewAPI.deleteReviewByAdmin(reviewId);
      // Reload danh sách sau khi xóa
      await loadReportedReviews();
    } catch (err: any) {
      console.error("Failed to delete review:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Không thể xóa review. Vui lòng thử lại."
      );
    } finally {
      setDeletingId(null);
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
    <div className="nc-PageManageReviews" data-nc-id="PageManageReviews">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Quản lý Review bị Báo cáo
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Xem và xử lý các review bị người dùng báo cáo
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
              onClick={loadReportedReviews}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {reportedReviews.length === 0 && !loading ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Không có review bị báo cáo
          </h3>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Hiện tại không có review nào bị người dùng báo cáo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reportedReviews.map((review) => (
            <div
              key={review.reviewId}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StartRating
                      point={review.rating}
                      className="flex items-center"
                    />
                    {review.reportCount && review.reportCount > 0 && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full">
                        {review.reportCount} báo cáo
                      </span>
                    )}
                    {review.status && (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          review.status === "Deleted"
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            : review.status === "Reported"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                        }`}
                      >
                        {review.status}
                      </span>
                    )}
                  </div>

                  {review.customerName && (
                    <div className="flex items-center gap-2 mb-2">
                      {review.customerImageUrl ? (
                        <img
                          src={review.customerImageUrl}
                          alt={review.customerName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                          {review.customerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {review.customerName}
                      </span>
                    </div>
                  )}

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

                  <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <span>Booking ID: {review.bookingId}</span>
                    {review.createdAt && (
                      <span>Ngày tạo: {formatDate(review.createdAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() =>
                      review.reviewId && handleDeleteReview(review.reviewId)
                    }
                    disabled={deletingId === review.reviewId}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {deletingId === review.reviewId ? (
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
                        Đang xóa...
                      </span>
                    ) : (
                      "Xóa Review"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageManageReviews;




