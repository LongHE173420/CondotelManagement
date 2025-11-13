import axiosClient from "./axiosClient";

// CustomerBookingDTO - Thông tin khách hàng với bookings của họ
export interface CustomerBookingDTO {
  customerId: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  totalBookings: number;
  totalSpent?: number;
  lastBookingDate?: string;
  bookings?: CustomerBookingInfo[];
}

// CustomerBookingInfo - Thông tin booking của customer
export interface CustomerBookingInfo {
  bookingId: number;
  condotelId: number;
  condotelName?: string;
  startDate: string;
  endDate: string;
  totalPrice?: number;
  status: string;
  createdAt: string;
}

// API Calls
export const customerAPI = {
  // GET /api/host/customer - Lấy tất cả customers đã đặt phòng của host
  getCustomerBooked: async (): Promise<CustomerBookingDTO[]> => {
    const response = await axiosClient.get<any[]>("/host/customer");
    // Normalize response từ backend (PascalCase -> camelCase)
    return response.data.map((item: any) => ({
      customerId: item.CustomerId || item.customerId,
      customerName: item.CustomerName || item.customerName,
      customerEmail: item.CustomerEmail || item.customerEmail,
      customerPhone: item.CustomerPhone || item.customerPhone,
      totalBookings: item.TotalBookings !== undefined ? item.TotalBookings : item.totalBookings || 0,
      totalSpent: item.TotalSpent !== undefined ? item.TotalSpent : item.totalSpent,
      lastBookingDate: item.LastBookingDate || item.lastBookingDate,
      bookings: item.Bookings
        ? item.Bookings.map((b: any) => ({
            bookingId: b.BookingId || b.bookingId,
            condotelId: b.CondotelId || b.condotelId,
            condotelName: b.CondotelName || b.condotelName,
            startDate: b.StartDate || b.startDate,
            endDate: b.EndDate || b.endDate,
            totalPrice: b.TotalPrice !== undefined ? b.TotalPrice : b.totalPrice,
            status: b.Status || b.status,
            createdAt: b.CreatedAt || b.createdAt,
          }))
        : item.bookings
        ? item.bookings.map((b: any) => ({
            bookingId: b.bookingId || b.BookingId,
            condotelId: b.condotelId || b.CondotelId,
            condotelName: b.condotelName || b.CondotelName,
            startDate: b.startDate || b.StartDate,
            endDate: b.endDate || b.EndDate,
            totalPrice: b.totalPrice !== undefined ? b.totalPrice : b.TotalPrice,
            status: b.status || b.Status,
            createdAt: b.createdAt || b.CreatedAt,
          }))
        : undefined,
    }));
  },
};

export default customerAPI;






