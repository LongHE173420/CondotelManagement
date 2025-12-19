import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bookingAPI, { RefundRequestDTO } from "api/booking";
import { useAuth } from "contexts/AuthContext";
import { toast } from "react-toastify";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import Heading2 from "components/Heading/Heading2";
import NcImage from "shared/NcImage/NcImage";

const PageRefundRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refundRequests, setRefundRequests] = useState<RefundRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequestDTO | null>(null);
  const [appealReason, setAppealReason] = useState("");
  const [appealing, setAppealing] = useState(false);

  useEffect(() => {
    loadRefundRequests();
  }, [user]);

  const loadRefundRequests = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getRefundRequests();
      setRefundRequests(response || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách yêu cầu hoàn tiền");
      console.error("Error loading refund requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppealClick = (refund: RefundRequestDTO) => {
    if (refund.status !== "Rejected") {
      toast.warning("Chỉ có thể kháng cáo cho yêu cầu đã bị từ chối");
      return;
    }
    setSelectedRefund(refund);
    setAppealReason("");
  };

  const handleSubmitAppeal = async () => {
    if (!selectedRefund) return;

    if (!appealReason.trim() || appealReason.length < 10 || appealReason.length > 500) {
      toast.error("Lý do kháng cáo phải từ 10-500 ký tự");
      return;
    }

    try {
      setAppealing(true);
      const result = await bookingAPI.appealRefundRequest(selectedRefund.refundRequestId, appealReason);
      
      if (result.success) {
        toast.success("✅ Kháng cáo hoàn tiền thành công. Vui lòng chờ admin xem xét");
        setSelectedRefund(null);
        setAppealReason("");
        loadRefundRequests();
      } else {
        toast.error(result.message || "Kháng cáo thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi kháng cáo");
      console.error("Error appealing refund:", err);
    } finally {
      setAppealing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string; label: string } } = {
      Pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "⏳ Đang chờ xử lý" },
      Completed: { bg: "bg-blue-100", text: "text-blue-800", label: "✅ Đã xử lý" },
      Refunded: { bg: "bg-green-100", text: "text-green-800", label: "✅ Đã hoàn tiền" },
      Rejected: { bg: "bg-red-100", text: "text-red-800", label: "❌ Bị từ chối" },
      Appealed: { bg: "bg-purple-100", text: "text-purple-800", label: "🔄 Đang kháng cáo" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const canAppeal = (refund: RefundRequestDTO): boolean => {
    if (refund.status !== "Rejected") return false;
    if ((refund.attemptNumber || 0) >= 2) return false;
    
    const rejectedAt = refund.rejectedAt ? new Date(refund.rejectedAt) : null;
    if (!rejectedAt) return false;
    
    const now = new Date();
    const daysDiff = (now.getTime() - rejectedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 3;
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 lg:py-24 space-y-16">
      <Heading2 heading="🏦 Quản lý yêu cầu hoàn tiền" />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {refundRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Bạn chưa có yêu cầu hoàn tiền nào</p>
          <ButtonPrimary onClick={() => navigate("/booking-history")}>
            Quay lại lịch sử booking
          </ButtonPrimary>
        </div>
      ) : (
        <div className="space-y-4">
          {refundRequests.map((refund) => (
            <div key={refund.refundRequestId} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Booking ID</p>
                  <p className="font-semibold text-lg">#{refund.bookingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  {getStatusBadge(refund.status || "Pending")}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Ngày yêu cầu</p>
                  <p className="font-semibold">
                    {refund.createdAt ? new Date(refund.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lần kháng cáo</p>
                  <p className="font-semibold">{(refund.attemptNumber || 0) + 1}/2</p>
                </div>
              </div>

              {refund.reason && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Lý do hoàn tiền</p>
                  <p className="text-gray-800">{refund.reason}</p>
                </div>
              )}

              {refund.status === "Rejected" && refund.rejectedAt && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Bị từ chối vào:</strong> {new Date(refund.rejectedAt).toLocaleString("vi-VN")}
                  </p>
                  {refund.rejectionReason && (
                    <p className="text-sm text-red-800 mt-2">
                      <strong>Lý do:</strong> {refund.rejectionReason}
                    </p>
                  )}
                </div>
              )}

              {refund.status === "Appealed" && refund.appealedAt && (
                <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-4">
                  <p className="text-sm text-purple-800">
                    <strong>Kháng cáo vào:</strong> {new Date(refund.appealedAt).toLocaleString("vi-VN")}
                  </p>
                  {refund.appealReason && (
                    <p className="text-sm text-purple-800 mt-2">
                      <strong>Lý do kháng cáo:</strong> {refund.appealReason}
                    </p>
                  )}
                </div>
              )}

              {canAppeal(refund) ? (
                <div className="flex gap-2">
                  <ButtonPrimary
                    onClick={() => handleAppealClick(refund)}
                    className="flex-1"
                  >
                    🔄 Kháng cáo
                  </ButtonPrimary>
                </div>
              ) : refund.status === "Rejected" && !canAppeal(refund) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    ⏰ Hết thời hạn kháng cáo (3 ngày kể từ khi bị từ chối) hoặc đã kháng cáo đủ số lần
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Appeal Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4">🔄 Kháng cáo yêu cầu hoàn tiền</h3>
            
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-800">
                Booking: <strong>#{selectedRefund.bookingId}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Lý do kháng cáo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Vui lòng nhập lý do chi tiết (10-500 ký tự)"
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {appealReason.length}/500 ký tự
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-xs text-blue-800">
                ℹ️ Lý do kháng cáo phải có ít nhất 10 ký tự. Vui lòng giải thích chi tiết tại sao bạn cho rằng yêu cầu hoàn tiền của bạn là hợp lệ.
              </p>
            </div>

            <div className="flex gap-3">
              <ButtonSecondary
                onClick={() => setSelectedRefund(null)}
                className="flex-1"
              >
                Hủy
              </ButtonSecondary>
              <ButtonPrimary
                onClick={handleSubmitAppeal}
                disabled={appealing || appealReason.length < 10}
                className="flex-1"
              >
                {appealing ? "Đang gửi..." : "Gửi kháng cáo"}
              </ButtonPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageRefundRequests;
