import axiosClient from "./axiosClient";

// CustomerDTO - Thông tin khách hàng từ API /host/Customer
export interface CustomerDTO {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

// CustomerBookingDTO - Thông tin khách hàng với bookings của họ (for backward compatibility)
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
  // GET /api/host/Customer - Lấy tất cả customers đã đặt phòng của host
  getCustomers: async (): Promise<CustomerDTO[]> => {
    const response = await axiosClient.get<any>("/host/Customer");
    // Normalize response từ backend (PascalCase -> camelCase)
    // Handle both array and object with data property
    const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    return data.map((item: any) => ({
      userId: item.UserId || item.userId,
      fullName: item.FullName || item.fullName,
      email: item.Email || item.email,
      phone: item.Phone || item.phone,
      gender: item.Gender || item.gender,
      dateOfBirth: item.DateOfBirth || item.dateOfBirth,
      address: item.Address || item.address,
    }));
  },

  // GET /api/host/customer - Lấy tất cả customers đã đặt phòng của host (backward compatibility)
  getCustomerBooked: async (): Promise<CustomerBookingDTO[]> => {
    try {
      // Try new endpoint first
      const customers = await customerAPI.getCustomers();
      // Convert to CustomerBookingDTO format for backward compatibility
      return customers.map((customer) => ({
        customerId: customer.userId,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        totalBookings: 0, // Will be calculated if needed
        totalSpent: undefined,
        lastBookingDate: undefined,
        bookings: undefined,
      }));
    } catch (err: any) {
      // Fallback to old endpoint if new one fails
      const response = await axiosClient.get<any[]>("/host/customer");
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
    }
  },
};

export default customerAPI;






