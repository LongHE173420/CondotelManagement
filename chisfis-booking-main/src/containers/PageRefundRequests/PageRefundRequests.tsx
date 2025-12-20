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

  const handleResubmitClick = (refund: RefundRequestDTO) => {
    if (refund.status !== "Rejected") {
      toast.warning("Chỉ có thể gửi lại yêu cầu đã bị từ chối");
      return;
    }
    const resubmissionCount = (refund as any).resubmissionCount || 0;
    if (resubmissionCount >= 1) {
      toast.error("Bạn đã vượt quá số lần gửi lại yêu cầu hoàn tiền (tối đa 1 lần)");
      return;
    }
    // Navigate to request refund page with booking ID to resubmit
    navigate(`/request-refund/${refund.bookingId}`);
  };

  // Removed handleSubmitAppeal - now using direct navigation to request-refund page

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

  const canResubmit = (refund: RefundRequestDTO): boolean => {
    if (refund.status !== "Rejected") return false;
    // Check resubmissionCount (max 1 resubmission)
    const resubmissionCount = (refund as any).resubmissionCount || 0;
    return resubmissionCount < 1;
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
                  <p className="text-sm text-gray-600">Số lần gửi lại</p>
                  <p className="font-semibold">{((refund as any).resubmissionCount || 0)}/1</p>
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
                  {((refund as any).resubmissionCount || 0) < 1 && (
                    <p className="text-sm text-blue-800 mt-2 bg-blue-50 p-2 rounded">
                      ⚠️ <strong>Quan trọng:</strong> Bạn có thể sửa thông tin ngân hàng và gửi lại yêu cầu hoàn tiền một lần.
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

              {canResubmit(refund) ? (
                <div className="flex gap-2">
                  <ButtonPrimary
                    onClick={() => handleResubmitClick(refund)}
                    className="flex-1"
                  >
                    🔄 Gửi lại yêu cầu
                  </ButtonPrimary>
                </div>
              ) : refund.status === "Rejected" && !canResubmit(refund) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Bạn đã vượt quá số lần gửi lại yêu cầu hoàn tiền (tối đa 1 lần). Vui lòng liên hệ admin.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No modal needed - redirect to request refund page for resubmission */}
    </div>
  );
};

export default PageRefundRequests;
