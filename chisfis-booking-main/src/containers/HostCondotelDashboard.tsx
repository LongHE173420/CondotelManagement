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
import HostAmenityContent from "containers/HostAmenityPage/HostAmenityContent";
import { toastSuccess, toastError, toastWarning, toastInfo } from "utils/toast";

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
        toastError("Không thể tải danh sách booking");
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
      
      // Prepare success message
      const successMsg = `Đã cập nhật trạng thái sang "${mapStatusToVN(normalizedStatus)}" thành công!`;
      
      // Voucher chỉ được tạo khi booking chuyển từ "Confirmed" sang "Completed"
      if (normalizedStatus === "completed" && currentStatus === "confirmed") {
        try {
          const voucherAPI = (await import("api/voucher")).default;
          const result = await voucherAPI.autoCreate(bookingId);
          if (result.success && result.data && result.data.length > 0) {
            const voucherMsg = `✅ Đã tự động tạo ${result.data.length} voucher cho booking ${bookingId}`;
            toastSuccess(successMsg);
            toastSuccess(voucherMsg, { autoClose: 4000 });
          } else {
            // Hiển thị thông báo rõ ràng về lý do không tạo được voucher
            const reason = result.message || "Không thể tạo voucher tự động";
            let userMessage = `⚠️ Không tạo voucher tự động: ${reason}`;
            
            // Kiểm tra các lý do phổ biến
            if (reason.toLowerCase().includes("autogenerate") || reason.toLowerCase().includes("auto-generate")) {
              userMessage = "⚠️ Không tạo voucher: Host đã tắt tính năng tự động tạo voucher (AutoGenerate)";
            } else if (reason.toLowerCase().includes("setting") || reason.toLowerCase().includes("cấu hình")) {
              userMessage = "⚠️ Không tạo voucher: Cài đặt voucher chưa được cấu hình đầy đủ";
            }
            
            toastSuccess(successMsg);
            toastWarning(userMessage, { autoClose: 4000 });
          }
        } catch (voucherErr: any) {
          // Không block việc cập nhật status nếu tạo voucher thất bại
          const errorMsg = voucherErr.response?.data?.message || voucherErr.message || "Lỗi không xác định";
          
          // Hiển thị thông báo nếu có thông tin cụ thể từ server
          if (errorMsg.toLowerCase().includes("autogenerate") || errorMsg.toLowerCase().includes("auto-generate")) {
            toastSuccess(successMsg);
            toastWarning("💡 Lưu ý: Host có thể đã tắt tính năng tự động tạo voucher (AutoGenerate)", { autoClose: 4000 });
          } else if (errorMsg.toLowerCase().includes("setting") || errorMsg.toLowerCase().includes("cấu hình")) {
            toastSuccess(successMsg);
            toastWarning("💡 Lưu ý: Cài đặt voucher có thể chưa được cấu hình đầy đủ", { autoClose: 4000 });
          } else {
            toastSuccess(successMsg);
            toastWarning("Không thể tạo voucher tự động", { autoClose: 4000 });
          }
        }
      } else {
        // Show success message
        toastSuccess(successMsg);
      }
      
      // Refresh danh sách
      await fetchBookings();
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || "Không thể cập nhật trạng thái. Vui lòng thử lại sau.";
      toastError(message);
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
      toastSuccess("Đã vô hiệu hóa condotel thành công!");
      // Refresh danh sách
      await fetchCondotels();
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || "Không thể vô hiệu hóa condotel. Vui lòng thử lại sau.";
      toastError(message);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Header Section */}
        <div className="mb-8 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Bảng điều khiển Host
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                Quản lý condotel, khuyến mãi, voucher, gói dịch vụ và khách hàng của bạn
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-semibold">Host Panel</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation - Modern Design */}
        <div className="mb-8 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-2 border border-white/20 dark:border-neutral-700/50">
          <nav className="flex flex-wrap gap-2" aria-label="Tabs">
          <button
            onClick={() => handleTabChange("condotels")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "condotels"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Căn hộ
            </span>
          </button>
          <button
            onClick={() => handleTabChange("promotions")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "promotions"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 109.5 8H12m-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Khuyến mãi
            </span>
          </button>
          <button
            onClick={() => handleTabChange("vouchers")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "vouchers"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 109.5 8H12m-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Voucher
            </span>
          </button>
          <button
            onClick={() => handleTabChange("service-packages")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "service-packages"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Gói dịch vụ
            </span>
          </button>
          <button
            onClick={() => handleTabChange("customers")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "customers"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Khách hàng
            </span>
          </button>
          <button
            onClick={() => handleTabChange("reports")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "reports"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Báo cáo
            </span>
          </button>
          <button
            onClick={() => handleTabChange("reviews")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "reviews"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Đánh giá
            </span>
          </button>
          <button
            onClick={() => handleTabChange("bookings")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "bookings"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Đặt phòng
            </span>
          </button>
          <button
            onClick={() => handleTabChange("package")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "package"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Gói đăng ký
            </span>
          </button>
          <button
            onClick={() => handleTabChange("wallet")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "wallet"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v4a3 3 0 003 3z" />
              </svg>
              Tài khoản ngân hàng
            </span>
          </button>
          <button
            onClick={() => handleTabChange("verification")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "verification"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Xác thực CCCD
            </span>
          </button>
          <button
            onClick={() => handleTabChange("amenities")}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === "amenities"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Tiện ích
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "promotions" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostPromotionContent />
        </div>
      ) : activeTab === "vouchers" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostVoucherContent />
        </div>
      ) : activeTab === "service-packages" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostServicePackageContent />
        </div>
      ) : activeTab === "customers" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostCustomerContent />
        </div>
      ) : activeTab === "reports" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostReportContent />
        </div>
      ) : activeTab === "reviews" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostReviewContent />
        </div>
      ) : activeTab === "package" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostPackageContent />
        </div>
      ) : activeTab === "payout" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostPayoutContent />
        </div>
      ) : activeTab === "wallet" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostWalletContent />
        </div>
      ) : activeTab === "verification" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostVerificationContent />
        </div>
      ) : activeTab === "amenities" ? (
        <div className="mt-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <HostAmenityContent />
        </div>
      ) : activeTab === "bookings" ? (
        <div className="mt-6">
          <div className="mb-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Danh sách đặt phòng
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Các đặt phòng của căn hộ bạn quản lý
            </p>
          </div>
          {bookingsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-neutral-700/50">
              <svg className="mx-auto h-16 w-16 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">Chưa có đặt phòng nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-neutral-700/50">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-neutral-700 dark:to-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">
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
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {bookings.map((booking) => (
                    <tr key={booking.bookingId} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-neutral-700/50 dark:hover:to-neutral-800/50 transition-all duration-200">
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
                        <span
                          className="inline-flex items-center text-xs font-bold px-4 py-2 rounded-xl shadow-md"
                          style={{
                            backgroundColor: getStatusColor(normalizeStatus(booking.status)).bg,
                            color: getStatusColor(normalizeStatus(booking.status)).text,
                          }}
                        >
                          {mapStatusToVN(normalizeStatus(booking.status))}
                        </span>
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
          <div className="flex items-center justify-between mb-8 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Danh sách căn hộ của bạn
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Quản lý và chỉnh sửa các căn hộ condotel của bạn
              </p>
            </div>
            <ButtonPrimary 
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm căn hộ
              </span>
            </ButtonPrimary>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : condotels.length === 0 ? (
            <div className="text-center py-16 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-neutral-700/50">
              <svg className="mx-auto h-16 w-16 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-4">Chưa có căn hộ nào.</p>
              <ButtonPrimary 
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Thêm căn hộ đầu tiên
              </ButtonPrimary>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {condotels.map((item) => (
                <div 
                  key={item.condotelId} 
                  className="flex flex-col bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-neutral-700/50 hover:shadow-2xl transition-shadow duration-300"
                >
                  <div className="p-4 pb-0">
                    <CondotelCard data={item} className="!border-0 !shadow-none" />
                  </div>
                  <div className="flex gap-2 p-4 pt-3 mt-auto border-t border-neutral-200 dark:border-neutral-700">
                    <ButtonPrimary 
                      onClick={() => navigate(`/edit-condotel/${item.condotelId}`)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Sửa
                      </span>
                    </ButtonPrimary>
                    <Button
                      onClick={() => handleDelete(item.condotelId, item.name)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default HostCondotelDashboard;






