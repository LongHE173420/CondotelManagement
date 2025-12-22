import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bookingAPI, { BookingDTO } from "api/booking";
import moment from "moment";
import { toastSuccess, showErrorMessage } from "utils/toast";

// --- Định nghĩa kiểu dữ liệu ---
type BookingStatusVN = "Đã xác nhận" | "Đang xử lý" | "Đã hủy" | "Hoàn thành";

// Map status từ backend sang tiếng Việt
const mapStatusToVN = (status: string): BookingStatusVN => {
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
            return "Đang xử lý";
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
    // Xử lý cả DateOnly (YYYY-MM-DD) và DateTime
    const date = new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00"));
    return date.toLocaleDateString("vi-VN");
};

// ✅ Tính toán hạn cuối hủy (2 ngày TRƯỚC ngày check-in)
const getCancellationDeadline = (bookingData: BookingDTO | null | undefined): Date | null => {
    if (!bookingData?.startDate) return null;
    
    const checkInDate = new Date(bookingData.startDate);
    const deadline = new Date(checkInDate);
    deadline.setDate(deadline.getDate() - 2);
    return deadline;
};

// ✅ Kiểm tra xem booking còn trong thời hạn hủy không (ít nhất 2 ngày trước check-in)
const isWithinCancellationWindow = (bookingData: BookingDTO | null | undefined): boolean => {
    if (!bookingData?.startDate) return false;
    const checkInDate = new Date(bookingData.startDate);
    const now = new Date();
    const daysBeforeCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysBeforeCheckIn >= 2;
};

// --- [NÂNG CẤP UI] Component Badge cho Trạng thái ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusVN = mapStatusToVN(status);
    let colorClasses = "";
    switch (status?.toLowerCase()) {
        case "confirmed":
            colorClasses = "bg-green-100 text-green-700";
            break;
        case "pending":
            colorClasses = "bg-blue-100 text-blue-700";
            break;
        case "cancelled":
            colorClasses = "bg-red-100 text-red-700";
            break;
        case "completed":
            colorClasses = "bg-gray-100 text-gray-700";
            break;
        default:
            colorClasses = "bg-blue-100 text-blue-700";
    }
    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClasses}`}
        >
            {statusVN}
        </span>
    );
};

// --- Badge "Đặt hộ" ---
const BookingForOthersBadge: React.FC = () => {
    return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 ml-2">
            Đặt hộ
        </span>
    );
};

// ✅ Kiểm tra xem booking có thể hoàn tiền không - phải trước ít nhất 2 ngày so với ngày check-in
const canRefund = (booking: BookingDTO): boolean => {
    // Chỉ cho phép yêu cầu hoàn tiền nếu:
    // 1. Booking status = "Cancelled"
    
    if (booking.status?.toLowerCase() !== "cancelled") {
        return false;
    }
    
    // Nếu đã có refund request, chỉ cho phép nếu status là "Pending" hoặc "Rejected"
    if (booking.refundStatus !== null && booking.refundStatus !== undefined) {
        const refundStatusLower = booking.refundStatus?.toLowerCase();
        return refundStatusLower === "pending" || refundStatusLower === "rejected";
    }
    
    // Ưu tiên sử dụng field canRefund từ backend
    if (booking.canRefund !== undefined) {
        return booking.canRefund;
    }
    
    // Fallback: Logic kiểm tra nếu backend chưa trả về canRefund
    // Phân biệt Cancel Payment vs Cancel Booking:
    // - Cancel Payment: Booking chưa thanh toán (totalPrice = 0 hoặc null) → không refund
    // - Cancel Booking: Booking đã thanh toán (totalPrice > 0) → có thể refund nếu trong thời gian cho phép
    
    // Kiểm tra xem booking có totalPrice > 0 (có thể đã thanh toán)
    const hasPrice = booking.totalPrice && booking.totalPrice > 0;
    
    // Nếu không có giá, có thể là cancel payment → không refund
    if (!hasPrice) {
        return false;
    }
    
    // ✅ Kiểm tra xem còn ít nhất 2 ngày trước check-in không
    if (!booking.startDate) return false;
    const checkInDate = new Date(booking.startDate);
    const now = new Date();
    const daysBeforeCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysBeforeCheckIn >= 2;
};

// ✅ Kiểm tra xem booking có thể hủy không - phải trước ít nhất 2 ngày so với ngày check-in
const canCancel = (booking: BookingDTO): boolean => {
    const status = booking.status?.toLowerCase();
    
    // Chỉ cho phép hủy nếu status là Confirmed hoặc Pending
    if (status !== "confirmed" && status !== "pending") return false;
    
    // Kiểm tra xem còn ít nhất 2 ngày trước check-in không
    if (!booking.startDate) return false;
    const checkInDate = new Date(booking.startDate);
    const now = new Date();
    const daysBeforeCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysBeforeCheckIn >= 2;
};

// --- [NÂNG CẤP UI] Component Nút Thao tác ---
const ActionButtons: React.FC<{ 
    booking: BookingDTO; 
    onView: (id: number) => void;
    onCancel?: (id: number) => void;
    navigate: (path: string) => void;
}> = ({ booking, onView, onCancel, navigate }) => {
    const showRefundButton = canRefund(booking);
    const showCancelButton = canCancel(booking);
    
    // Xác định text cho nút hoàn tiền
    const getRefundButtonText = (): string => {
        if (booking.refundStatus?.toLowerCase() === "pending") {
            return "⏳ Chờ hoàn tiền";
        } else if (booking.refundStatus?.toLowerCase() === "rejected") {
            return "🔄 Nhập lại thông tin";
        }
        return "💰 Hoàn tiền";
    };
    
    // Xác định tooltip cho nút hoàn tiền
    const getRefundButtonTitle = (): string => {
        if (booking.refundStatus?.toLowerCase() === "pending") {
            return "Yêu cầu hoàn tiền của bạn đang chờ xử lý";
        } else if (booking.refundStatus?.toLowerCase() === "rejected") {
            return "Yêu cầu hoàn tiền bị từ chối. Vui lòng nhập lại thông tin ngân hàng.";
        }
        return "Yêu cầu hoàn tiền (hủy trong vòng 2 ngày)";
    };
    
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => booking.bookingId && onView(booking.bookingId)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                >
                    Xem
                </button>
                {showCancelButton && onCancel && (
                    <button 
                        onClick={() => booking.bookingId && onCancel(booking.bookingId)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                        title="Hủy đặt phòng"
                    >
                        ❌ Hủy
                    </button>
                )}
            </div>
            {showRefundButton && (
                <button 
                    onClick={() => booking.bookingId && navigate(`/request-refund/${booking.bookingId}`)}
                    className={`px-3 py-1 text-white rounded-md text-sm font-medium w-full transition-colors ${
                        booking.refundStatus?.toLowerCase() === "rejected" 
                            ? "bg-red-500 hover:bg-red-600" 
                            : "bg-orange-500 hover:bg-orange-600"
                    }`}
                    title={getRefundButtonTitle()}
                >
                    {getRefundButtonText()}
                </button>
            )}
        </div>
    );
};

// --- Component Modal Chi tiết Thanh toán ---
const PaymentDetailModal: React.FC<{ 
    booking: BookingDTO | null; 
    isOpen: boolean; 
    onClose: () => void;
    navigate: (path: string) => void;
}> = ({ booking, isOpen, onClose, navigate }) => {
    if (!isOpen || !booking) return null;

    const statusVN = mapStatusToVN(booking.status || "Pending");
    const isPending = booking.status?.toLowerCase() === "pending";

    const handleRetryPayment = () => {
        if (booking.bookingId) {
            navigate(`/checkout?bookingId=${booking.bookingId}&retry=true`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Chi tiết thanh toán
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Mã booking</span>
                                <span className="text-sm text-gray-900">#{booking.bookingId}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Trạng thái</span>
                                <StatusBadge status={booking.status || "Pending"} />
                            </div>
                            
                            {isPending && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Lưu ý:</strong> Booking đang ở trạng thái "{statusVN}". 
                                        Hệ thống đang xác nhận thanh toán của bạn. 
                                        Nếu bạn đã hoàn tất thanh toán, vui lòng đợi vài giây để hệ thống cập nhật trạng thái.
                                    </p>
                                </div>
                            )}
                            
                            {/* Hiển thị refund status nếu booking đã bị hủy */}
                            {booking.status?.toLowerCase() === "cancelled" && booking.refundStatus && (
                                <div className={`rounded-lg p-3 ${
                                    booking.refundStatus === "Pending" ? "bg-yellow-50 border border-yellow-200" :
                                    booking.refundStatus === "Refunded" || booking.refundStatus === "Completed" ? "bg-green-50 border border-green-200" :
                                    "bg-gray-50 border border-gray-200"
                                }`}>
                                    <p className={`text-sm ${
                                        booking.refundStatus === "Pending" ? "text-yellow-800" :
                                        booking.refundStatus === "Refunded" || booking.refundStatus === "Completed" ? "text-green-800" :
                                        "text-gray-800"
                                    }`}>
                                        <strong>Trạng thái hoàn tiền:</strong> {
                                            booking.refundStatus === "Pending" ? "Đang chờ hoàn tiền" :
                                            booking.refundStatus === "Refunded" ? "Đã hoàn tiền thành công (PayOS)" :
                                            booking.refundStatus === "Completed" ? "Đã hoàn tiền thủ công" :
                                            booking.refundStatus
                                        }
                                    </p>
                                </div>
                            )}
                            
                            
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Tổng tiền</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {formatPrice(booking.totalPrice)}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Ngày đặt</span>
                                <span className="text-sm text-gray-900">
                                    {formatDate(booking.createdAt)}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Phương thức thanh toán</span>
                                <span className="text-sm text-gray-900">PayOS</span>
                            </div>
                            
                            {booking.promotionId && (
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-500">Khuyến mãi</span>
                                    <span className="text-sm text-green-600">Đã áp dụng</span>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold text-gray-900">Tổng thanh toán</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {formatPrice(booking.totalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                        {isPending && (
                            <button
                                type="button"
                                onClick={handleRetryPayment}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:w-auto sm:text-sm"
                            >
                                💳 Thanh toán lại
                            </button>
                        )}
                        {booking.status?.toLowerCase() === "cancelled" && (booking.refundStatus === "Pending" || booking.refundStatus === "Rejected") && (
                            <button
                                type="button"
                                onClick={() => booking.bookingId && navigate(`/request-refund/${booking.bookingId}`)}
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none sm:w-auto sm:text-sm ${
                                    booking.refundStatus === "Rejected"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-yellow-600 hover:bg-yellow-700"
                                }`}
                            >
                                {booking.refundStatus === "Rejected" ? "🔄 Nhập lại thông tin hoàn tiền" : "⏳ Xem trạng thái hoàn tiền"}
                            </button>
                        )}
                        {booking.status?.toLowerCase() === "cancelled" && !booking.refundStatus && canRefund(booking) && (
                            <button
                                type="button"
                                onClick={() => booking.bookingId && navigate(`/request-refund/${booking.bookingId}`)}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none sm:w-auto sm:text-sm"
                            >
                                💰 Yêu cầu hoàn tiền
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Component Trang Quản lý Booking (Tenant) ---
const PageTenantBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<BookingDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, action: (() => void) | null}>({isOpen: false, title: "", message: "", action: null});
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Calculate pagination
    const totalItems = bookings.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentBookings = bookings.slice(startIndex, endIndex);
    
    // Reset to page 1 when changing items per page or sort
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage, sortBy]);

    // Fetch bookings từ API
    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await bookingAPI.getMyBookings();
                // Sort bookings
                let sortedData = [...data];
                switch (sortBy) {
                    case "newest":
                        sortedData.sort((a, b) => {
                            const dateA = new Date(a.createdAt || 0).getTime();
                            const dateB = new Date(b.createdAt || 0).getTime();
                            return dateB - dateA;
                        });
                        break;
                    case "oldest":
                        sortedData.sort((a, b) => {
                            const dateA = new Date(a.createdAt || 0).getTime();
                            const dateB = new Date(b.createdAt || 0).getTime();
                            return dateA - dateB;
                        });
                        break;
                    case "status":
                        sortedData.sort((a, b) => {
                            return (a.status || "").localeCompare(b.status || "");
                        });
                        break;
                }
                setBookings(sortedData);
            } catch (err: any) {
                setError("Không thể tải danh sách đặt phòng. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [sortBy]);

    // Xem chi tiết booking
    const handleViewBooking = (id: number) => {
        navigate(`/booking-history/${id}`);
    };

    // Xử lý hủy booking
    const handleCancel = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Hủy đặt phòng",
            message: "Bạn có chắc chắn muốn hủy đặt phòng này? Nếu hủy trong vòng 2 ngày, bạn có thể yêu cầu hoàn tiền.",
            action: async () => {
                setCancellingId(id);
                try {
                    // Lấy thông tin booking trước khi hủy để kiểm tra điều kiện
                    const bookingBeforeCancel = bookings.find(b => b.bookingId === id);
                    const createdAt = bookingBeforeCancel?.createdAt;
                    
                    await bookingAPI.cancelBooking(id);
                    
                    // Kiểm tra xem có trong vòng 2 ngày không để tự động chuyển đến trang refund
                    if (createdAt) {
                        const createdDate = new Date(createdAt);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 2) {
                            // Nếu hủy trong vòng 2 ngày, tự động chuyển đến trang nhập thông tin hoàn tiền
                            setConfirmModal({
                                isOpen: true,
                                title: "Yêu cầu hoàn tiền",
                                message: "Đã hủy đặt phòng thành công! Bạn có muốn điền thông tin để yêu cầu hoàn tiền ngay bây giờ không?",
                                action: () => {
                                    navigate(`/request-refund/${id}`);
                                }
                            });
                            return; // Không reload danh sách, vì sẽ navigate đi
                        }
                    }
                    
                    toastSuccess("Đã hủy đặt phòng thành công. Nếu hủy trong vòng 2 ngày, bạn có thể yêu cầu hoàn tiền.", { autoClose: 5000 });
                    
                    // Reload bookings để cập nhật trạng thái
                    const data = await bookingAPI.getMyBookings();
                    // Sort lại sau khi reload
                    let sortedData = [...data];
                    switch (sortBy) {
                        case "newest":
                            sortedData.sort((a, b) => {
                                const dateA = new Date(a.createdAt || 0).getTime();
                                const dateB = new Date(b.createdAt || 0).getTime();
                                return dateB - dateA;
                            });
                            break;
                        case "oldest":
                            sortedData.sort((a, b) => {
                                const dateA = new Date(a.createdAt || 0).getTime();
                                const dateB = new Date(b.createdAt || 0).getTime();
                                return dateA - dateB;
                            });
                            break;
                        case "status":
                            sortedData.sort((a, b) => {
                                return (a.status || "").localeCompare(b.status || "");
                            });
                            break;
                    }
                    setBookings(sortedData);
                    setConfirmModal({isOpen: false, title: "", message: "", action: null});
                } catch (err: any) {
                    showErrorMessage("Hủy đặt phòng", err);
                } finally {
                    setCancellingId(null);
                }
            }
        });
    };

    return (
        // Nền xám cho cả trang để làm nổi bật Card
        <div className="p-4 md:p-8 bg-gray-100 min-h-screen">

            {/* --- Header --- */}
            <header className="max-w-7xl mx-auto mb-6 flex justify-between items-center py-4">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    CONDOTEL
                </h1>
            </header>

            {/* --- [NÂNG CẤP UI] Main Content Card --- */}
            <div className="max-w-7xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl">
                {/* --- Tiêu đề và Controls --- */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
                            Danh sách đặt phòng của bạn
                        </h2>
                        <button
                            onClick={() => navigate("/refund-requests")}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                            title="Xem danh sách yêu cầu hoàn tiền của bạn"
                        >
                            🏦 Quản lý hoàn tiền
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Items per page selector */}
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value={5}>5 / trang</option>
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>
                        
                        {/* Sort selector */}
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="flex-1 md:w-48 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="newest">Sắp xếp: Mới nhất</option>
                            <option value="oldest">Ngày cũ nhất</option>
                            <option value="status">Trạng thái</option>
                        </select>
                    </div>
                </div>

                {/* --- Bảng Dữ liệu --- */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-500">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Bạn chưa có đặt phòng nào.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">STT</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ảnh</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên căn hộ</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày đặt phòng</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-in / Check-out</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentBookings.map((booking, index) => (
                                    <tr key={booking.bookingId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap align-middle">
                                            {(booking.thumbnailImage || booking.condotelImageUrl) ? (
                                                <img 
                                                    src={booking.thumbnailImage || booking.condotelImageUrl}
                                                    alt={booking.condotelName || "Condotel"} 
                                                    className="w-24 h-16 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                                                    onClick={() => booking.condotelId && navigate(`/listing-stay-detail/${booking.condotelId}`)}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = '<div class="w-24 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-24 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
                                                    onClick={() => booking.condotelId && navigate(`/listing-stay-detail/${booking.condotelId}`)}>
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 align-middle">
                                            <div className="flex items-center">
                                                {booking.condotelName || `Condotel #${booking.condotelId}`}
                                                {booking.guestFullName && <BookingForOthersBadge />}
                                            </div>
                                            {booking.guestFullName && (
                                                <div className="mt-1 text-xs text-gray-500">
                                                    Người lưu trú: {booking.guestFullName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 align-middle">
                                            {formatDate(booking.createdAt)}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 align-middle">
                                            <div>{formatDate(booking.startDate)}</div>
                                            <div className="text-xs text-gray-400">→ {formatDate(booking.endDate)}</div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 align-middle">
                                            <div className="flex flex-col">
                                                <span>{formatPrice(booking.totalPrice)}</span>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setShowPaymentModal(true);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap align-middle">
                                            <div className="flex flex-col gap-1">
                                                <StatusBadge status={booking.status || "Pending"} />
                                                {booking.checkInToken && (
                                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                                        <div className="font-semibold text-blue-900">Mã check-in:</div>
                                                        <div className="font-mono text-blue-700 text-sm font-bold">{booking.checkInToken}</div>
                                                        {booking.checkInTokenGeneratedAt && (
                                                            <div className="text-gray-500 mt-1">
                                                                Tạo lúc: {moment(booking.checkInTokenGeneratedAt).format("DD/MM/YYYY HH:mm")}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap align-middle">
                                            <ActionButtons 
                                                booking={booking}
                                                onView={handleViewBooking}
                                                onCancel={handleCancel}
                                                navigate={navigate}
                                            />
                                            {cancellingId === booking.bookingId && (
                                                <span className="mt-1 block text-xs text-gray-500">Đang hủy...</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- [NÂNG CẤP UI] Phân trang (Pagination) --- */}
                {bookings.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                            Hiển thị <strong>{startIndex + 1}</strong>-<strong>{endIndex}</strong> trên <strong>{totalItems}</strong> đặt phòng
                        </span>
                        
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                {/* Previous button */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Trước
                                </button>
                                
                                {/* Page numbers */}
                                <div className="flex items-center gap-1">
                                    {/* First page */}
                                    {currentPage > 3 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentPage(1)}
                                                className="w-9 h-9 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                1
                                            </button>
                                            {currentPage > 4 && (
                                                <span className="px-2 text-gray-400">...</span>
                                            )}
                                        </>
                                    )}
                                    
                                    {/* Pages around current page */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            return page === currentPage || 
                                                   page === currentPage - 1 || 
                                                   page === currentPage + 1 ||
                                                   (page === 1 && currentPage <= 2) ||
                                                   (page === totalPages && currentPage >= totalPages - 1);
                                        })
                                        .map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-9 h-9 border rounded-lg text-sm font-medium transition-colors ${
                                                    page === currentPage
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))
                                    }
                                    
                                    {/* Last page */}
                                    {currentPage < totalPages - 2 && (
                                        <>
                                            {currentPage < totalPages - 3 && (
                                                <span className="px-2 text-gray-400">...</span>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(totalPages)}
                                                className="w-9 h-9 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                </div>
                                
                                {/* Next button */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Tiếp →
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Payment Detail Modal */}
            <PaymentDetailModal
                booking={selectedBooking}
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setSelectedBooking(null);
                }}
                navigate={navigate}
            />

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                        {confirmModal.title}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setConfirmModal({...confirmModal, isOpen: false})}
                                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                                {confirmModal.message}
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 dark:bg-neutral-700/50">
                            <button
                                onClick={() => setConfirmModal({...confirmModal, isOpen: false})}
                                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-500 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmModal.action) {
                                        confirmModal.action();
                                    }
                                    setConfirmModal({...confirmModal, isOpen: false});
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageTenantBookings;