import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bookingAPI, { BookingDTO } from "api/booking";

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

// Kiểm tra xem booking có thể hoàn tiền không (hủy trong vòng 2 ngày)
const canRefund = (booking: BookingDTO): boolean => {
    if (booking.status?.toLowerCase() !== "cancelled") {
        return false;
    }
    
    // Tính số ngày từ khi tạo booking đến hiện tại
    if (!booking.createdAt) return false;
    const createdDate = new Date(booking.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Nếu hủy trong vòng 2 ngày (từ ngày tạo booking)
    return diffDays <= 2;
};

// Kiểm tra xem booking có thể hủy không
const canCancel = (booking: BookingDTO): boolean => {
    const status = booking.status?.toLowerCase();
    // Chỉ cho phép hủy nếu status là Pending hoặc Confirmed
    return status === "pending" || status === "confirmed";
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

// --- Component Trang Quản lý Booking (Tenant) ---
const PageTenantBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<BookingDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [cancellingId, setCancellingId] = useState<number | null>(null);

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
                                                src={booking.condotelImageUrl || "https://via.placeholder.com/96x64?text=No+Image"} 
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
                                            {formatPrice(booking.totalPrice)}
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
        </div>
    );
};

export default PageTenantBookings;