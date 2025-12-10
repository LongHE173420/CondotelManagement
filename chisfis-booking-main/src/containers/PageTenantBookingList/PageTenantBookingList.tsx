import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bookingAPI, { BookingDTO } from "api/booking";
import moment from "moment";

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

// Kiểm tra xem booking có thể hoàn tiền không
// Sử dụng field canRefund từ API response (Option 1)
// Fallback về logic cũ nếu canRefund không có trong response
const canRefund = (booking: BookingDTO): boolean => {
    // Chỉ cho phép yêu cầu hoàn tiền nếu:
    // 1. Booking status = "Cancelled"
    // 2. refundStatus = null (chưa có refund request)
    // 3. canRefund = true (từ backend)
    
    if (booking.status?.toLowerCase() !== "cancelled") {
        return false;
    }
    
    // Nếu đã có refund request (refundStatus không null), không cho phép tạo request mới
    if (booking.refundStatus !== null && booking.refundStatus !== undefined) {
        return false;
    }
    
    // Ưu tiên sử dụng field canRefund từ backend
    if (booking.canRefund !== undefined) {
        return booking.canRefund;
    }
    
    // Fallback: Logic cũ nếu backend chưa trả về canRefund
    // Phân biệt Cancel Payment vs Cancel Booking:
    // - Cancel Payment: Booking chưa thanh toán (totalPrice = 0 hoặc null) → không refund
    // - Cancel Booking: Booking đã thanh toán (totalPrice > 0) → có refund
    
    // Kiểm tra xem booking có totalPrice > 0 (có thể đã thanh toán)
    const hasPrice = booking.totalPrice && booking.totalPrice > 0;
    
    // Nếu không có giá, có thể là cancel payment → không refund
    if (!hasPrice) {
        return false;
    }
    
    // Tính số ngày từ khi tạo booking đến hiện tại
    if (!booking.createdAt) return false;
    const createdDate = new Date(booking.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Nếu hủy trong vòng 2 ngày (từ ngày tạo booking) VÀ booking có giá (đã thanh toán)
    return diffDays <= 2;
};

// Kiểm tra xem booking có thể hủy không
const canCancel = (booking: BookingDTO): boolean => {
    const status = booking.status?.toLowerCase();
    // Chỉ cho phép hủy nếu status là Confirmed (không cho phép hủy khi đang xử lý - Pending)
    return status === "confirmed";
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
                    className="px-3 py-1 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors w-full"
                    title="Yêu cầu hoàn tiền (hủy trong vòng 2 ngày)"
                >
                    💰 Hoàn tiền
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
                console.error("Error fetching bookings:", err);
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
    const handleCancel = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đặt phòng này? Nếu hủy trong vòng 2 ngày, bạn có thể yêu cầu hoàn tiền.")) {
            return;
        }

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
                    if (window.confirm("Đã hủy đặt phòng thành công! Bạn có muốn điền thông tin để yêu cầu hoàn tiền ngay bây giờ không?")) {
                        navigate(`/request-refund/${id}`);
                        return; // Không reload danh sách, vì sẽ navigate đi
                    }
                }
            }
            
            alert("Đã hủy đặt phòng thành công. Nếu hủy trong vòng 2 ngày, bạn có thể yêu cầu hoàn tiền.");
            
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
        } catch (err: any) {
            console.error("Error cancelling booking:", err);
            alert(
                err.response?.data?.message || 
                err.message || 
                "Không thể hủy đặt phòng. Vui lòng thử lại sau."
            );
        } finally {
            setCancellingId(null);
        }
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
                {/* --- Tiêu đề (Đã sửa) --- */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0 whitespace-nowrap">
                        Danh sách đặt phòng của bạn
                    </h2>

                    {/* --- Hộp Sắp xếp (Đã sửa) --- */}
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="newest">Sắp xếp theo: Mới nhất</option>
                        <option value="oldest">Ngày cũ nhất</option>
                        <option value="status">Trạng thái</option>
                    </select>
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
                                {bookings.map((booking, index) => (
                                    <tr key={booking.bookingId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">
                                            {index + 1}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap align-middle">
                                            <img 
                                                src={booking.condotelImageUrl || ""}
                                                onError={(e) => {
                                                  console.error("❌ Image load error");
                                                  (e.target as HTMLImageElement).style.display = "none";
                                                }} 
                                                alt={booking.condotelName || "Condotel"} 
                                                className="w-24 h-16 object-cover rounded-lg shadow-sm" 
                                            />
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 align-middle">
                                            {booking.condotelName || `Condotel #${booking.condotelId}`}
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
                                            <StatusBadge status={booking.status || "Pending"} />
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
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                            Hiển thị <strong>1</strong>-<strong>{bookings.length}</strong> trên <strong>{bookings.length}</strong> đặt phòng
                        </span>
                        {/* Pagination có thể thêm sau nếu cần */}
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
        </div>
    );
};

export default PageTenantBookings;