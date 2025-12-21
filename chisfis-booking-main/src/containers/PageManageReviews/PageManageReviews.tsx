import React, { FC, useState, useEffect } from "react";
import { reviewAPI, ReportedReviewDTO } from "api/review";
import StartRating from "components/StartRating/StartRating";

const PageManageReviews: FC = () => {
  const [reportedReviews, setReportedReviews] = useState<ReportedReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Modal confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: null,
  });

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

  const handleDeleteReview = (reviewId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Review",
      message: "Bạn có chắc chắn muốn xóa review này? Hành động này không thể hoàn tác.",
      action: async () => {
        try {
          setDeletingId(reviewId);
          await reviewAPI.deleteReviewByAdmin(reviewId);
          await loadReportedReviews();
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        } catch (err: any) {
          toastError(
            err.response?.data?.message ||
              err.message ||
              "Không thể xóa review. Vui lòng thử lại."
          );
        } finally {
          setDeletingId(null);
        }
      },
    });
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 dark:border-yellow-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-800/50">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
          Quản lý Review bị Báo cáo
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Xem và xử lý các review bị người dùng báo cáo
        </p>
      </div>

      {error && (
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
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
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {reportedReviews.length === 0 && !loading ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-yellow-50/30 dark:from-neutral-800 dark:to-yellow-900/10 rounded-2xl shadow-xl border border-yellow-200/50 dark:border-yellow-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Không có review bị báo cáo
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Hiện tại không có review nào bị người dùng báo cáo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reportedReviews.map((review) => (
            <div
              key={review.reviewId}
              className="bg-gradient-to-br from-white to-yellow-50/30 dark:from-neutral-800 dark:to-yellow-900/10 rounded-2xl shadow-xl p-6 border border-yellow-200/50 dark:border-yellow-800/50 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StartRating
                      point={review.rating}
                      className="flex items-center"
                    />
                    {review.reportCount && review.reportCount > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                        {review.reportCount} báo cáo
                      </span>
                    )}
                    {review.status && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          review.status === "Deleted"
                            ? "bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 text-gray-800 dark:text-gray-200"
                            : review.status === "Reported"
                            ? "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-800 dark:text-yellow-200"
                            : "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200"
                        } border`}
                      >
                        {review.status}
                      </span>
                    )}
                  </div>

                  {review.customerName && (
                    <div className="flex items-center gap-2 mb-2">
                      {review.customerImageUrl || review.userImageUrl ? (
                        <img
                          src={review.customerImageUrl || review.userImageUrl}
                          alt={review.customerName || review.userName}
                          className="w-10 h-10 rounded-full border-2 border-yellow-200 dark:border-yellow-800 shadow-md"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold shadow-md">
                          {(review.customerName || review.userName || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {review.customerName || review.userName || review.userFullName}
                      </span>
                    </div>
                  )}

                  {review.title && (
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                      {review.title}
                    </h3>
                  )}

                  {review.comment && (
                    <p className="text-neutral-700 dark:text-neutral-300 mb-3 leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  {review.reply && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Phản hồi từ Host:</span>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{review.reply}</p>
                    </div>
                  )}

                  {review.createdAt && (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">
                      <span className="font-medium">Ngày tạo:</span> {formatDate(review.createdAt)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() =>
                      review.reviewId && handleDeleteReview(review.reviewId)
                    }
                    disabled={deletingId === review.reviewId}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {deletingId === review.reviewId ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl p-6 max-w-sm w-11/12">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", action: null })}
                className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => confirmModal.action?.()}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManageReviews;
