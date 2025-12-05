import React, { useEffect, useState } from "react";
import CondotelCard from "components/CondotelCard/CondotelCard";
import Button from "shared/Button/Button";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import condotelAPI, { CondotelDTO } from "api/condotel";
import bookingAPI, { BookingDTO } from "api/booking";
import HostPromotionContent from "containers/HostPromotionPage/HostPromotionContent";
import HostVoucherContent from "containers/HostVoucherPage/HostVoucherContent";
import HostCustomerContent from "containers/HostCustomerPage/HostCustomerContent";
import HostReportContent from "containers/HostReportPage/HostReportContent";
import HostServicePackageContent from "containers/HostServicePackagePage/HostServicePackageContent";
import HostReviewContent from "containers/HostReviewPage/HostReviewContent";
import HostPackageContent from "containers/HostPackagePage/HostPackageContent";
import HostPayoutContent from "containers/HostPayoutPage/HostPayoutContent";
import HostWalletContent from "containers/HostWalletPage/HostWalletContent";
import HostVerificationContent from "containers/HostVerificationPage/HostVerificationContent";

const HostCondotelDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "condotels";

  // Ensure only Host can access
  useEffect(() => {
    if (isAuthenticated && user?.roleName !== "Host") {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (activeTab === "condotels") {
      fetchCondotels();
    } else if (activeTab === "bookings") {
      fetchBookings();
    }
    // Reviews will be loaded by HostReviewContent component
  }, [activeTab]);

  const fetchCondotels = async () => {
    try {
      setLoading(true);
      const data = await condotelAPI.getAllForHost();
      setCondotels(data);
    } catch {
      setCondotels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const data = await bookingAPI.getHostBookings();
      setBookings(data);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Format số tiền
  const formatPrice = (price: number | undefined): string => {
    if (!price) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format ngày tháng
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "";
    const date = new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00"));
    return date.toLocaleDateString("vi-VN");
  };

  // Normalize status để đảm bảo format nhất quán (PascalCase)
  const normalizeStatus = (status: string | undefined): string => {
    if (!status) return "Pending";
    const lower = status.toLowerCase();
    switch (lower) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      default:
        return "Pending";
    }
  };

  // Map status từ backend sang tiếng Việt
  const mapStatusToVN = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Đang xử lý";
      case "cancelled":
        return "Đã hủy";
      case "completed":
        return "Hoàn thành";
      default:
        return status || "Đang xử lý";
    }
  };


  // Get status color for select dropdown
  const getStatusColor = (status: string): { bg: string; text: string } => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return { bg: "#dcfce7", text: "#166534" }; // green-100, green-800
      case "completed":
        return { bg: "#dcfce7", text: "#166534" }; // green-100, green-800
      case "pending":
        return { bg: "#dbeafe", text: "#1e40af" }; // blue-100, blue-800
      case "cancelled":
        return { bg: "#fee2e2", text: "#991b1b" }; // red-100, red-800
      default:
        return { bg: "#dbeafe", text: "#1e40af" }; // blue-100, blue-800
    }
  };

  // Handle status change
  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    // Normalize status để đảm bảo format đúng
    const normalizedStatus = normalizeStatus(newStatus);
    
    // Lấy booking hiện tại để so sánh
    const currentBooking = bookings.find(b => b.bookingId === bookingId);
    const currentStatus = normalizeStatus(currentBooking?.status);
    
    // Nếu status không thay đổi, không làm gì
    if (currentStatus === normalizedStatus) {
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn đổi trạng thái từ "${mapStatusToVN(currentStatus)}" sang "${mapStatusToVN(normalizedStatus)}"?`)) {
      // Reload để reset select về giá trị cũ
      fetchBookings();
      return;
    }

    setUpdatingStatusId(bookingId);
    try {
      await bookingAPI.updateHostBookingStatus(bookingId, normalizedStatus);
      
      // Nếu status mới là "Completed", tự động tạo voucher
      if (normalizedStatus === "completed") {
        try {
          const voucherAPI = (await import("api/voucher")).default;
          const result = await voucherAPI.autoCreate(bookingId);
          if (result.success && result.data && result.data.length > 0) {
            console.log(`✅ Đã tự động tạo ${result.data.length} voucher cho booking ${bookingId}:`, result.data);
            // Có thể hiển thị thông báo về voucher đã tạo
          } else {
            console.log(`ℹ️ Không tạo voucher tự động: ${result.message}`);
          }
        } catch (voucherErr: any) {
          // Không block việc cập nhật status nếu tạo voucher thất bại
          console.error("Error auto-creating vouchers:", voucherErr);
        }
      }
      
      // Refresh danh sách
      await fetchBookings();
      // Show success message
      const successMsg = `Đã cập nhật trạng thái sang "${mapStatusToVN(normalizedStatus)}" thành công!`;
      console.log(successMsg);
      // Có thể thay bằng toast notification nếu có
      alert(successMsg);
    } catch (err: any) {
      console.error("Error updating booking status:", err);
      const message = err.response?.data?.message || err.response?.data?.error || "Không thể cập nhật trạng thái. Vui lòng thử lại sau.";
      alert(message);
      // Reload để reset select về giá trị cũ
      fetchBookings();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleAdd = () => {
    navigate("/add-condotel");
  };

  const handleTabChange = (tab: string) => {
    navigate(`/host-dashboard?tab=${tab}`);
  };

  const handleDelete = async (condotelId: number, condotelName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn vô hiệu hóa condotel "${condotelName}"?\nCondotel sẽ được chuyển sang trạng thái "Inactive" và không còn hiển thị cho khách hàng.`)) {
      return;
    }

    try {
      await condotelAPI.delete(condotelId);
      alert("Đã vô hiệu hóa condotel thành công!");
      // Refresh danh sách
      await fetchCondotels();
    } catch (err: any) {
      console.error("Error deleting condotel:", err);
      const message = err.response?.data?.message || err.response?.data?.error;
      alert(message || "Không thể vô hiệu hóa condotel. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="px-4 max-w-6xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bảng điều khiển Host</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Quản lý condotel, khuyến mãi, voucher, gói dịch vụ và khách hàng của bạn
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleTabChange("condotels")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "condotels"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Căn hộ
          </button>
          <button
            onClick={() => handleTabChange("promotions")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "promotions"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Khuyến mãi
          </button>
          <button
            onClick={() => handleTabChange("vouchers")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "vouchers"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Voucher
          </button>
          <button
            onClick={() => handleTabChange("service-packages")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "service-packages"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Gói dịch vụ
          </button>
          <button
            onClick={() => handleTabChange("customers")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "customers"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Khách hàng
          </button>
          <button
            onClick={() => handleTabChange("reports")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "reports"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Báo cáo
          </button>
          <button
            onClick={() => handleTabChange("reviews")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "reviews"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Đánh giá
          </button>
          <button
            onClick={() => handleTabChange("bookings")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "bookings"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Đặt phòng
          </button>
          <button
            onClick={() => handleTabChange("package")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "package"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            Gói đăng ký
          </button>
          <button
            onClick={() => handleTabChange("wallet")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "wallet"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            💳 Tài khoản ngân hàng
          </button>
          <button
            onClick={() => handleTabChange("verification")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "verification"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            🆔 Xác thực CCCD
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "promotions" ? (
        <div className="mt-6">
          <HostPromotionContent />
        </div>
      ) : activeTab === "vouchers" ? (
        <div className="mt-6">
          <HostVoucherContent />
        </div>
      ) : activeTab === "service-packages" ? (
        <div className="mt-6">
          <HostServicePackageContent />
        </div>
      ) : activeTab === "customers" ? (
        <div className="mt-6">
          <HostCustomerContent />
        </div>
      ) : activeTab === "reports" ? (
        <div className="mt-6">
          <HostReportContent />
        </div>
      ) : activeTab === "reviews" ? (
        <div className="mt-6">
          <HostReviewContent />
        </div>
      ) : activeTab === "package" ? (
        <div className="mt-6">
          <HostPackageContent />
        </div>
      ) : activeTab === "payout" ? (
        <div className="mt-6">
          <HostPayoutContent />
        </div>
      ) : activeTab === "wallet" ? (
        <div className="mt-6">
          <HostWalletContent />
        </div>
      ) : activeTab === "verification" ? (
        <div className="mt-6">
          <HostVerificationContent />
        </div>
      ) : activeTab === "bookings" ? (
        <div className="mt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Danh sách đặt phòng</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Các đặt phòng của căn hộ bạn quản lý
            </p>
          </div>
          {bookingsLoading ? (
            <div className="flex justify-center py-14">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-neutral-600 dark:text-neutral-400">Chưa có đặt phòng nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-neutral-800 rounded-lg shadow">
                <thead className="bg-neutral-50 dark:bg-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Mã đặt phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Căn hộ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Check-in / Check-out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Ngày đặt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {bookings.map((booking) => (
                    <tr key={booking.bookingId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        #{booking.bookingId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {booking.condotelImageUrl && (
                            <img
                              src={booking.condotelImageUrl}
                              alt={booking.condotelName}
                              className="w-12 h-12 rounded-lg object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {booking.condotelName || `Condotel #${booking.condotelId}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900 dark:text-neutral-100">
                          {booking.customerName || `Customer #${booking.customerId}`}
                        </div>
                        {booking.customerEmail && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {booking.customerEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900 dark:text-neutral-100">
                          {formatDate(booking.startDate)}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          → {formatDate(booking.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {formatPrice(booking.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={normalizeStatus(booking.status)}
                          onChange={(e) => handleStatusChange(booking.bookingId, e.target.value)}
                          disabled={updatingStatusId === booking.bookingId}
                          className="text-xs font-semibold px-3 py-1 rounded-full border-0 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                          style={{
                            backgroundColor: getStatusColor(normalizeStatus(booking.status)).bg,
                            color: getStatusColor(normalizeStatus(booking.status)).text,
                          }}
                        >
                          <option value="Pending">Đang xử lý</option>
                          <option value="Confirmed">Đã xác nhận</option>
                          <option value="Cancelled">Đã hủy</option>
                          <option value="Completed">Hoàn thành</option>
                        </select>
                        {updatingStatusId === booking.bookingId && (
                          <span className="ml-2 text-xs text-neutral-500">Đang cập nhật...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {formatDate(booking.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Danh sách căn hộ của bạn</h2>
            <Button onClick={handleAdd}>+ Thêm căn hộ</Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-14">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600"></div>
            </div>
          ) : condotels.length === 0 ? (
            <p>Chưa có căn hộ nào.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {condotels.map((item) => (
                <div key={item.condotelId} className="space-y-3">
                  <CondotelCard data={item} />
                  <div className="flex gap-2">
                    <ButtonPrimary onClick={() => navigate(`/edit-condotel/${item.condotelId}`)}>
                      Sửa
                    </ButtonPrimary>
                    <Button
                      onClick={() => handleDelete(item.condotelId, item.name)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HostCondotelDashboard;






