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
      alert(
        err.response?.data?.message ||
          err.message ||
          "Không thể trả lời review. Vui lòng thử lại."
      );
    }
  };

  const handleReport = (reviewId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Báo cáo Review",
      message: "Bạn có chắc chắn muốn báo cáo review này? Review sẽ được gửi đến admin để xem xét.",
      action: async () => {
        setReportingId(reviewId);
        try {
          await reviewAPI.reportReview(reviewId);
          alert("Đã báo cáo review thành công!");
          await loadReviews();
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        } catch (err: any) {
          alert(
            err.response?.data?.message ||
              err.message ||
              "Không thể báo cáo review. Vui lòng thử lại."
          );
        } finally {
          setReportingId(null);
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
    <div className="nc-HostReviewContent" data-nc-id="HostReviewContent">
      <div className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-800/50">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
          Quản lý Reviews
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Xem và trả lời các reviews về condotel của bạn
        </p>
      </div>

      {error && (
        <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
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
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !loading ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-yellow-50/30 dark:from-neutral-800 dark:to-yellow-900/10 rounded-2xl shadow-xl border border-yellow-200/50 dark:border-yellow-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có reviews
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Hiện tại chưa có review nào cho condotel của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.reviewId}
              className="bg-gradient-to-br from-white to-yellow-50/30 dark:from-neutral-800 dark:to-yellow-900/10 rounded-2xl shadow-xl p-6 border border-yellow-200/50 dark:border-yellow-800/50 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {(review.userImageUrl || review.customerImageUrl) ? (
                      <img
                        src={review.userImageUrl || review.customerImageUrl}
                        alt={review.userName || review.customerName || "Customer"}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-yellow-200 dark:border-yellow-800 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {(review.userName || review.customerName || "C").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {review.userName || review.customerName || "Khách hàng"}
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

                  {/* Hiển thị reply nếu có */}
                  {review.reply && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-blue-500 rounded-r-xl shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          Phản hồi từ Host:
                        </span>
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        {review.reply}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Section */}
              {replyingId === review.reviewId ? (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
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
                      className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Gửi trả lời
                      </span>
                    </ButtonPrimary>
                    <ButtonSecondary
                      onClick={() => {
                        setReplyingId(null);
                        setReplyText("");
                      }}
                      className="text-sm bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Hủy
                    </ButtonSecondary>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2 pt-4 border-t border-yellow-200 dark:border-yellow-800">
                  {!review.reply && (
                    <ButtonPrimary
                      onClick={() => {
                        setReplyingId(review.reviewId!);
                        setReplyText("");
                      }}
                      className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Trả lời
                      </span>
                    </ButtonPrimary>
                  )}
                  {review.reply && (
                    <ButtonPrimary
                      onClick={() => {
                        setReplyingId(review.reviewId!);
                        setReplyText(review.reply || "");
                      }}
                      className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Sửa trả lời
                      </span>
                    </ButtonPrimary>
                  )}
                  <ButtonSecondary
                    onClick={() => handleReport(review.reviewId!)}
                    disabled={reportingId === review.reviewId}
                    className="text-sm bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
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
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Báo cáo
                      </span>
                    )}
                  </ButtonSecondary>
                </div>
              )}
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
                Báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostReviewContent;







