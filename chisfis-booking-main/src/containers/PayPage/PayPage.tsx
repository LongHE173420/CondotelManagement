import StartRating from "components/StartRating/StartRating";
import React, { FC, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import NcImage from "shared/NcImage/NcImage";
import bookingAPI, { BookingDTO } from "api/booking";
import voucherAPI, { VoucherDTO } from "api/voucher";
import moment from "moment";

export interface PayPageProps {
  className?: string;
}

const PayPage: FC<PayPageProps> = ({ className = "" }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdVouchers, setCreatedVouchers] = useState<VoucherDTO[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const bookingId = searchParams.get("bookingId");
  const status = searchParams.get("status");

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError("Không tìm thấy thông tin booking");
        setLoading(false);
        return;
      }

      try {
        const bookingData = await bookingAPI.getBookingById(parseInt(bookingId));
        setBooking(bookingData);
        
        // Nếu thanh toán thành công, thử tạo voucher tự động
        if (status === "success" && bookingData.status === "Confirmed") {
          createVouchersAfterBooking(parseInt(bookingId));
        }
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        setError(err.response?.data?.message || err.message || "Không thể tải thông tin booking");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, status]);

  const createVouchersAfterBooking = async (bookingId: number) => {
    setLoadingVouchers(true);
    setVoucherError(null);
    try {
      const result = await voucherAPI.autoCreate(bookingId);
      console.log("🎁 Voucher creation result:", result);
      
      if (result.success && result.data && result.data.length > 0) {
        setCreatedVouchers(result.data);
        console.log(`✅ Created ${result.data.length} vouchers for user`);
      } else {
        // Không có voucher được tạo (có thể host tắt auto-generate hoặc chưa cấu hình)
        console.log("ℹ️ No vouchers created:", result.message);
        setVoucherError(result.message || "Không có voucher được tạo tự động");
      }
    } catch (err: any) {
      console.error("Failed to create vouchers:", err);
      // Không hiển thị error vì đây là tính năng optional
      setVoucherError(err.response?.data?.message || "Không thể tạo voucher tự động");
    } finally {
      setLoadingVouchers(false);
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

    if (error || !booking) {
      return (
        <div className="w-full flex flex-col sm:rounded-2xl sm:border border-neutral-200 dark:border-neutral-700 space-y-8 px-0 sm:p-6 xl:p-8">
          <h2 className="text-3xl lg:text-4xl font-semibold text-red-600 dark:text-red-400">
            Có lỗi xảy ra
          </h2>
          <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
          <p className="text-neutral-600 dark:text-neutral-400">{error || "Không tìm thấy thông tin booking"}</p>
          <ButtonPrimary onClick={() => navigate("/")}>Về trang chủ</ButtonPrimary>
        </div>
      );
    }

    const isSuccess = status === "success" && booking.status === "Confirmed";
    const startDate = moment(booking.startDate);
    const endDate = moment(booking.endDate);
    const nights = endDate.diff(startDate, "days");

    return (
      <div className="w-full flex flex-col sm:rounded-2xl sm:border border-neutral-200 dark:border-neutral-700 space-y-8 px-0 sm:p-6 xl:p-8">
        <h2 className={`text-3xl lg:text-4xl font-semibold ${isSuccess ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
          {isSuccess ? "Thanh toán thành công! 🎉" : "Đang chờ thanh toán"}
        </h2>

        <div className="border-b border-neutral-200 dark:border-neutral-700"></div>

        {!isSuccess && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Lưu ý:</strong> Booking của bạn đang ở trạng thái "{booking.status}". 
              {booking.status === "Pending" && " Vui lòng hoàn tất thanh toán để xác nhận đặt phòng."}
            </p>
          </div>
        )}

        {/* ------------------------ */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Thông tin đặt phòng</h3>
          {booking.condotelImageUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 w-full sm:w-40">
                <div className="aspect-w-4 aspect-h-3 sm:aspect-h-4 rounded-2xl overflow-hidden">
                  <NcImage src={booking.condotelImageUrl} alt={booking.condotelName || "Condotel"} />
                </div>
              </div>
              <div className="pt-5 sm:pb-5 sm:px-5 space-y-3">
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                    Condotel
                  </span>
                  <span className="text-base sm:text-lg font-medium mt-1 block">
                    {booking.condotelName || "Căn hộ"}
                  </span>
                </div>
                <div className="w-10 border-b border-neutral-200 dark:border-neutral-700"></div>
                <StartRating />
              </div>
            </div>
          )}
          <div className="mt-6 border border-neutral-200 dark:border-neutral-700 rounded-3xl flex flex-col sm:flex-row divide-y sm:divide-x sm:divide-y-0 divide-neutral-200 dark:divide-neutral-700">
            <div className="flex-1 p-5 flex space-x-4">
              <svg
                className="w-8 h-8 text-neutral-300 dark:text-neutral-6000"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.33333 8.16667V3.5M18.6667 8.16667V3.5M8.16667 12.8333H19.8333M5.83333 24.5H22.1667C23.4553 24.5 24.5 23.4553 24.5 22.1667V8.16667C24.5 6.878 23.4553 5.83333 22.1667 5.83333H5.83333C4.54467 5.83333 3.5 6.878 3.5 8.16667V22.1667C3.5 23.4553 4.54467 24.5 5.83333 24.5Z"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex flex-col">
                <span className="text-sm text-neutral-400">Ngày</span>
                <span className="mt-1.5 text-lg font-semibold">
                  {startDate.format("DD MMM")} - {endDate.format("DD MMM, YYYY")}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {nights} đêm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------ */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Chi tiết booking</h3>
          <div className="flex flex-col space-y-4">
            <div className="flex text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">Mã booking</span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                #{booking.bookingId}
              </span>
            </div>
            <div className="flex text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">Ngày đặt</span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                {moment(booking.createdAt).format("DD MMM, YYYY")}
              </span>
            </div>
            <div className="flex text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">Tổng tiền</span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                {booking.totalPrice ? booking.totalPrice.toLocaleString() : "0"} đ
              </span>
            </div>
            <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">Trạng thái</span>
              <span className={`flex-1 font-medium ${
                booking.status === "Confirmed" ? "text-green-600 dark:text-green-400" :
                booking.status === "Pending" ? "text-yellow-600 dark:text-yellow-400" :
                booking.status === "Cancelled" ? "text-red-600 dark:text-red-400" :
                "text-neutral-900 dark:text-neutral-100"
              }`}>
                {booking.status === "Confirmed" ? "Đã xác nhận" :
                 booking.status === "Pending" ? "Đang chờ" :
                 booking.status === "Cancelled" ? "Đã hủy" :
                 booking.status}
              </span>
            </div>
            <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
              <span className="flex-1">Phương thức thanh toán</span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                PayOS
              </span>
            </div>
          </div>
        </div>

        {/* Vouchers Section - Hiển thị voucher được tạo tự động */}
        {isSuccess && (
          <div className="space-y-4">
            {loadingVouchers ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Đang tạo voucher cho bạn...
                  </p>
                </div>
              </div>
            ) : createdVouchers.length > 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                      🎁 Bạn đã nhận được {createdVouchers.length} voucher!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Chúc mừng! Bạn có thể sử dụng các voucher này cho lần đặt phòng tiếp theo.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  {createdVouchers.map((voucher) => (
                    <div
                      key={voucher.voucherId}
                      className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-green-200 dark:border-green-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-lg text-green-600 dark:text-green-400">
                              {voucher.code}
                            </span>
                            {voucher.discountPercentage && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-semibold">
                                -{voucher.discountPercentage}%
                              </span>
                            )}
                            {voucher.discountAmount && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-semibold">
                                -{voucher.discountAmount.toLocaleString("vi-VN")} đ
                              </span>
                            )}
                          </div>
                          {voucher.description && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {voucher.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                            <span>
                              HSD: {moment(voucher.endDate).format("DD/MM/YYYY")}
                            </span>
                            {voucher.usageLimit && (
                              <span>
                                Giới hạn: {voucher.usedCount || 0}/{voucher.usageLimit} lần
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <ButtonPrimary
                    onClick={() => navigate("/my-vouchers")}
                    className="w-full sm:w-auto"
                  >
                    Xem tất cả voucher của tôi
                  </ButtonPrimary>
                </div>
              </div>
            ) : voucherError ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {voucherError}
                </p>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <ButtonPrimary onClick={() => navigate("/my-bookings")}>
            Xem booking của tôi
          </ButtonPrimary>
          <ButtonPrimary onClick={() => navigate("/")} className="bg-neutral-600 hover:bg-neutral-700">
            Về trang chủ
          </ButtonPrimary>
        </div>
      </div>
    );
  };

  return (
    <div className={`nc-PayPage ${className}`} data-nc-id="PayPage">
      <main className="container mt-11 mb-24 lg:mb-32 ">
        <div className="max-w-4xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default PayPage;
