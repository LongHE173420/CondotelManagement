import React, { useState } from "react";

// --- Định nghĩa kiểu dữ liệu ---
type BookingStatus = "Thành công" | "Đang xử lý" | "Thất bại";

interface Booking {
    id: string;
    stt: number;
    imageUrl: string;
    apartmentName: string;
    bookingDate: string;
    price: string;
    status: BookingStatus;
}

// --- Dữ liệu mẫu (Mock Data) ---
const mockBookingData: Booking[] = [
    {
        id: "1",
        stt: 1,
        imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
        apartmentName: "Mường Thanh Sea View",
        bookingDate: "01/10/2025",
        price: "2.300.000 vnđ",
        status: "Thành công",
    },
    {
        id: "2",
        stt: 2,
        imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
        apartmentName: "Vinpearl Ocean",
        bookingDate: "01/10/2025",
        price: "2.300.000 vnđ",
        status: "Đang xử lý",
    },
    {
        id: "3",
        stt: 3,
        imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
        apartmentName: "FLC Luxury Beach",
        bookingDate: "01/10/2025",
        price: "2.300.000 vnđ",
        status: "Thất bại",
    },
];

// --- [NÂNG CẤP UI] Component Badge cho Trạng thái ---
const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
    let colorClasses = "";
    switch (status) {
        case "Thành công":
            colorClasses = "bg-green-100 text-green-700";
            break;
        case "Đang xử lý":
            colorClasses = "bg-blue-100 text-blue-700";
            break;
        case "Thất bại":
            colorClasses = "bg-red-100 text-red-700";
            break;
    }
    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClasses}`}
        >
            {status}
        </span>
    );
};

// --- [NÂNG CẤP UI] Component Nút Thao tác ---
const ActionButtons: React.FC<{ status: BookingStatus }> = ({ status }) => (
    <div className="flex items-center gap-2">
        <button className="px-3 py-1 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors">
            Xem
        </button>
        <button className="px-3 py-1 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
            Sửa
        </button>
        <button className="px-3 py-1 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors">
            Hủy
        </button>
    </div>
);

// --- Component Trang Quản lý Booking (Tenant) ---
const PageTenantBookings = () => {
    const [bookings] = useState<Booking[]>(mockBookingData);
    const [currentPage] = useState(1);

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

                    <select className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Sắp xếp theo: Mới nhất</option>
                        <option>Ngày cũ nhất</option>
                        <option>Trạng thái</option>
                    </select>
                </div>

                {/* --- Bảng Dữ liệu --- */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-gray-200">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">STT</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ảnh</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên căn hộ</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày đặt phòng</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">{booking.stt}</td>
                                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                                        <img src={booking.imageUrl} alt={booking.apartmentName} className="w-24 h-16 object-cover rounded-lg shadow-sm" />
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 align-middle">{booking.apartmentName}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 align-middle">{booking.bookingDate}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 align-middle">{booking.price}</td>
                                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                                        <StatusBadge status={booking.status} />
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                                        <ActionButtons status={booking.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- [NÂNG CẤP UI] Phân trang (Pagination) --- */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                        Hiển thị <strong>1</strong>-<strong>{bookings.length}</strong> trên <strong>{bookings.length}</strong> dịch vụ
                    </span>
                    <nav className="flex items-center space-x-1">
                        <button className="px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                            Trước
                        </button>
                        <button className="w-8 h-8 text-sm text-white bg-gray-800 rounded-md transition-colors">
                            1
                        </button>
                        <button className="w-8 h-8 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                            2
                        </button>
                        <button className="px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                            Sau
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default PageTenantBookings;