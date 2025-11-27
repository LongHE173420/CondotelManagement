import React, { FC, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import bookingAPI, { BookingDTO } from "api/booking";
import moment from "moment";
import { useTranslation } from "i18n/LanguageContext";

export interface PaymentCancelPageProps {
  className?: string;
}

const PaymentCancelPage: FC<PaymentCancelPageProps> = ({ className = "" }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get("bookingId");
  const status = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");
  const paymentLinkId = searchParams.get("paymentLinkId");

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        const bookingData = await bookingAPI.getBookingById(parseInt(bookingId));
        setBooking(bookingData);
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        // Không set error, vì có thể booking chưa được tạo hoặc đã bị xóa
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleRetryPayment = () => {
    if (bookingId) {
      navigate(`/checkout?bookingId=${bookingId}&retry=true`);
    } else {
      navigate("/");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="w-full flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-6000 mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Đang tải thông tin...</p>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col sm:rounded-2xl sm:border border-neutral-200 dark:border-neutral-700 space-y-8 px-0 sm:p-6 xl:p-8">
        {/* Icon và tiêu đề */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-3xl lg:text-4xl font-semibold text-red-600 dark:text-red-400">
            Thanh toán thất bại
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
            Giao dịch thanh toán của bạn đã bị hủy. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
          </p>
        </div>

        <div className="border-b border-neutral-200 dark:border-neutral-700"></div>

        {/* Thông tin chi tiết */}
        {booking && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Thông tin đặt phòng</h3>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Mã booking:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  #{booking.bookingId}
                </span>
              </div>
              {booking.condotelName && (
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Căn hộ:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {booking.condotelName}
                  </span>
                </div>
              )}
              {booking.startDate && booking.endDate && (
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Ngày:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {moment(booking.startDate).format("DD/MM/YYYY")} - {moment(booking.endDate).format("DD/MM/YYYY")}
                  </span>
                </div>
              )}
              {booking.totalPrice && (
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Tổng tiền:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {booking.totalPrice.toLocaleString()} đ
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Thông tin thanh toán */}
        {(orderCode || paymentLinkId) && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Thông tin thanh toán</h3>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 space-y-3">
              {orderCode && (
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Mã đơn hàng:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {orderCode}
                  </span>
                </div>
              )}
              {status && (
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Trạng thái:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {status === "cancelled" ? "Đã hủy" : status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lưu ý */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Lưu ý:</strong> Nếu bạn đã thanh toán nhưng vẫn thấy thông báo này, vui lòng kiểm tra lại email xác nhận hoặc liên hệ hỗ trợ với mã booking của bạn.
          </p>
        </div>

        {/* Các nút hành động */}
        <div className="flex flex-col sm:flex-row gap-4">
          {bookingId && (
            <ButtonPrimary onClick={handleRetryPayment} className="flex-1">
              Thử thanh toán lại
            </ButtonPrimary>
          )}
          <ButtonSecondary onClick={() => navigate("/my-bookings")} className="flex-1">
            Xem booking của tôi
          </ButtonSecondary>
          <ButtonSecondary onClick={() => navigate("/")} className="flex-1">
            Về trang chủ
          </ButtonSecondary>
        </div>
      </div>
    );
  };

  return (
    <div className={`nc-PaymentCancelPage ${className}`} data-nc-id="PaymentCancelPage">
      <main className="container mt-11 mb-24 lg:mb-32">
        <div className="max-w-4xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default PaymentCancelPage;





