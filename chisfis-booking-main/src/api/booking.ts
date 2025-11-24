import axiosClient from "./axiosClient";

// BookingDTO từ backend - khớp với C# DTO
export interface BookingDTO {
  bookingId: number;
  condotelId: number;
  customerId: number;
  startDate: string; // DateOnly format: YYYY-MM-DD
  endDate: string; // DateOnly format: YYYY-MM-DD
  totalPrice?: number; // decimal? in C#
  status: string; // "Pending", "Confirmed", "Cancelled", "Completed"
  promotionId?: number; // int? in C#
  isUsingRewardPoints: boolean;
  createdAt: string; // DateTime in C#
  
  // Thông tin condotel (nếu backend trả về khi join)
  condotelName?: string;
  condotelImageUrl?: string;
  condotelPricePerNight?: number;
  
  // Thông tin customer (nếu backend trả về khi join - cho host)
  customerName?: string;
  customerEmail?: string;
}

export interface CreateBookingDTO {
  condotelId: number;
  startDate: string; // YYYY-MM-DD (DateOnly)
  endDate: string; // YYYY-MM-DD (DateOnly)
  promotionId?: number;
  isUsingRewardPoints?: boolean;
  status?: string; // "Pending", "Confirmed", "Cancelled", "Completed" - defaults to "Pending"
  condotelName?: string; // Required by backend validation
}

export interface UpdateBookingDTO {
  bookingId: number;
  startDate?: string;
  endDate?: string;
  promotionId?: number;
  isUsingRewardPoints?: boolean;
  status?: string; // "Pending", "Confirmed", "Cancelled", "Completed"
}

export interface CheckAvailabilityResponse {
  condotelId: number;
  startDate: string; // DateOnly
  endDate: string; // DateOnly
  available: boolean;
}

// API Calls
export const bookingAPI = {
  // GET /api/booking/my - Lấy tất cả bookings của tenant hiện tại
  getMyBookings: async (): Promise<BookingDTO[]> => {
    const response = await axiosClient.get<any[]>("/booking/my");
    // Normalize response từ backend (PascalCase -> camelCase)
    return response.data.map((item: any) => ({
      bookingId: item.BookingId || item.bookingId,
      condotelId: item.CondotelId || item.condotelId,
      customerId: item.CustomerId || item.customerId,
      startDate: item.StartDate || item.startDate,
      endDate: item.EndDate || item.endDate,
      totalPrice: item.TotalPrice !== undefined ? item.TotalPrice : item.totalPrice,
      status: item.Status || item.status,
      promotionId: item.PromotionId !== undefined ? item.PromotionId : item.promotionId,
      isUsingRewardPoints: item.IsUsingRewardPoints !== undefined ? item.IsUsingRewardPoints : item.isUsingRewardPoints,
      createdAt: item.CreatedAt || item.createdAt,
      // Thông tin condotel nếu có
      condotelName: item.CondotelName || item.condotelName,
      condotelImageUrl: item.CondotelImageUrl || item.condotelImageUrl,
      condotelPricePerNight: item.CondotelPricePerNight !== undefined ? item.CondotelPricePerNight : item.condotelPricePerNight,
    }));
  },

  // GET /api/booking/{id} - Lấy booking theo ID
  getBookingById: async (id: number): Promise<BookingDTO> => {
    const response = await axiosClient.get<any>(`/booking/${id}`);
    const data = response.data;
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      bookingId: data.BookingId || data.bookingId,
      condotelId: data.CondotelId || data.condotelId,
      customerId: data.CustomerId || data.customerId,
      startDate: data.StartDate || data.startDate,
      endDate: data.EndDate || data.endDate,
      totalPrice: data.TotalPrice !== undefined ? data.TotalPrice : data.totalPrice,
      status: data.Status || data.status,
      promotionId: data.PromotionId !== undefined ? data.PromotionId : data.promotionId,
      isUsingRewardPoints: data.IsUsingRewardPoints !== undefined ? data.IsUsingRewardPoints : data.isUsingRewardPoints,
      createdAt: data.CreatedAt || data.createdAt,
      // Thông tin condotel nếu có
      condotelName: data.CondotelName || data.condotelName,
      condotelImageUrl: data.CondotelImageUrl || data.condotelImageUrl,
      condotelPricePerNight: data.CondotelPricePerNight !== undefined ? data.CondotelPricePerNight : data.condotelPricePerNight,
    };
  },

  // GET /api/booking/check-availability - Kiểm tra tính khả dụng
  checkAvailability: async (
    condotelId: number,
    startDate: string,
    endDate: string
  ): Promise<CheckAvailabilityResponse> => {
    const response = await axiosClient.get<CheckAvailabilityResponse>(
      "/booking/check-availability",
      {
        params: {
          condotelId,
          checkIn: startDate, // Backend có thể dùng checkIn/checkOut trong query params
          checkOut: endDate,
        },
      }
    );
    return response.data;
  },

  // POST /api/booking - Tạo booking mới
  createBooking: async (booking: CreateBookingDTO): Promise<BookingDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {
      CondotelId: booking.condotelId,
      StartDate: booking.startDate,
      EndDate: booking.endDate,
      Status: booking.status || "Pending", // Default to "Pending" for new bookings
    };

    // Backend requires CondotelName for validation
    if (booking.condotelName) {
      requestData.CondotelName = booking.condotelName;
    }

    if (booking.promotionId !== undefined) {
      requestData.PromotionId = booking.promotionId;
    }
    if (booking.isUsingRewardPoints !== undefined) {
      requestData.IsUsingRewardPoints = booking.isUsingRewardPoints;
    }

    console.log("📤 Creating booking with data:", JSON.stringify(requestData, null, 2));

    const response = await axiosClient.post<any>("/booking", requestData);
    console.log("✅ Booking created successfully:", response.data);

    // Backend returns result with nested Data property (ServiceResult pattern)
    // Response structure: { success: true, data: BookingDTO, message: ... }
    // Or direct BookingDTO if CreatedAtAction returns it directly
    const responseData: any = response.data;
    
    // Extract booking data - could be in responseData.data or responseData directly
    const data: any = responseData.data || responseData;
    
    console.log("📦 Extracted booking data:", data);
    
    // Normalize response từ backend (PascalCase -> camelCase)
    const bookingId = data.BookingId || data.bookingId;
    if (!bookingId) {
      console.error("❌ BookingId not found in response:", responseData);
      throw new Error("Booking created but BookingId not found in response");
    }
    
    return {
      bookingId: bookingId,
      condotelId: data.CondotelId || data.condotelId,
      customerId: data.CustomerId || data.customerId,
      startDate: data.StartDate || data.startDate,
      endDate: data.EndDate || data.endDate,
      totalPrice: data.TotalPrice !== undefined ? data.TotalPrice : data.totalPrice,
      status: data.Status || data.status,
      promotionId: data.PromotionId !== undefined ? data.PromotionId : data.promotionId,
      isUsingRewardPoints: data.IsUsingRewardPoints !== undefined ? data.IsUsingRewardPoints : data.isUsingRewardPoints,
      createdAt: data.CreatedAt || data.createdAt,
    };
  },

  // PUT /api/booking/{id} - Cập nhật booking
  updateBooking: async (
    id: number,
    booking: UpdateBookingDTO
  ): Promise<BookingDTO> => {
    // Map camelCase sang PascalCase
    const requestData: any = {
      BookingId: id,
    };

    if (booking.startDate) {
      requestData.StartDate = booking.startDate;
    }
    if (booking.endDate) {
      requestData.EndDate = booking.endDate;
    }
    if (booking.promotionId !== undefined) {
      requestData.PromotionId = booking.promotionId;
    }
    if (booking.isUsingRewardPoints !== undefined) {
      requestData.IsUsingRewardPoints = booking.isUsingRewardPoints;
    }

    const response = await axiosClient.put<any>(`/booking/${id}`, requestData);
    const data: any = response.data;
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      bookingId: data.BookingId || data.bookingId,
      condotelId: data.CondotelId || data.condotelId,
      customerId: data.CustomerId || data.customerId,
      startDate: data.StartDate || data.startDate,
      endDate: data.EndDate || data.endDate,
      totalPrice: data.TotalPrice !== undefined ? data.TotalPrice : data.totalPrice,
      status: data.Status || data.status,
      promotionId: data.PromotionId !== undefined ? data.PromotionId : data.promotionId,
      isUsingRewardPoints: data.IsUsingRewardPoints !== undefined ? data.IsUsingRewardPoints : data.isUsingRewardPoints,
      createdAt: data.CreatedAt || data.createdAt,
    };
  },

  // DELETE /api/booking/{id} - Hủy booking
  cancelBooking: async (id: number): Promise<void> => {
    await axiosClient.delete(`/booking/${id}`);
  },

  // ========== HOST BOOKING APIs ==========
  // GET /api/host/booking - Lấy tất cả bookings của host hiện tại
  getHostBookings: async (): Promise<BookingDTO[]> => {
    const response = await axiosClient.get<any[]>("/host/booking");
    // Normalize response từ backend (PascalCase -> camelCase)
    return response.data.map((item: any) => ({
      bookingId: item.BookingId || item.bookingId,
      condotelId: item.CondotelId || item.condotelId,
      customerId: item.CustomerId || item.customerId,
      startDate: item.StartDate || item.startDate,
      endDate: item.EndDate || item.endDate,
      totalPrice: item.TotalPrice !== undefined ? item.TotalPrice : item.totalPrice,
      status: item.Status || item.status,
      promotionId: item.PromotionId !== undefined ? item.PromotionId : item.promotionId,
      isUsingRewardPoints: item.IsUsingRewardPoints !== undefined ? item.IsUsingRewardPoints : item.isUsingRewardPoints,
      createdAt: item.CreatedAt || item.createdAt,
      // Thông tin condotel và customer nếu có
      condotelName: item.CondotelName || item.condotelName,
      condotelImageUrl: item.CondotelImageUrl || item.condotelImageUrl,
      condotelPricePerNight: item.CondotelPricePerNight !== undefined ? item.CondotelPricePerNight : item.condotelPricePerNight,
      customerName: item.CustomerName || item.customerName,
      customerEmail: item.CustomerEmail || item.customerEmail,
    }));
  },

  // GET /api/host/booking/customer/{customerId} - Lấy bookings theo customer
  getHostBookingsByCustomer: async (customerId: number): Promise<BookingDTO[]> => {
    const response = await axiosClient.get<any[]>(`/host/booking/customer/${customerId}`);
    // Normalize response từ backend (PascalCase -> camelCase)
    return response.data.map((item: any) => ({
      bookingId: item.BookingId || item.bookingId,
      condotelId: item.CondotelId || item.condotelId,
      customerId: item.CustomerId || item.customerId,
      startDate: item.StartDate || item.startDate,
      endDate: item.EndDate || item.endDate,
      totalPrice: item.TotalPrice !== undefined ? item.TotalPrice : item.totalPrice,
      status: item.Status || item.status,
      promotionId: item.PromotionId !== undefined ? item.PromotionId : item.promotionId,
      isUsingRewardPoints: item.IsUsingRewardPoints !== undefined ? item.IsUsingRewardPoints : item.isUsingRewardPoints,
      createdAt: item.CreatedAt || item.createdAt,
      condotelName: item.CondotelName || item.condotelName,
      condotelImageUrl: item.CondotelImageUrl || item.condotelImageUrl,
      condotelPricePerNight: item.CondotelPricePerNight !== undefined ? item.CondotelPricePerNight : item.condotelPricePerNight,
      customerName: item.CustomerName || item.customerName,
      customerEmail: item.CustomerEmail || item.customerEmail,
    }));
  },

  // PUT /api/host/booking/{id} - Host cập nhật booking status
  updateHostBookingStatus: async (id: number, status: string): Promise<BookingDTO> => {
    const requestData: any = {
      BookingId: id,
      Status: status,
    };

    const response = await axiosClient.put<any>(`/host/booking/${id}`, requestData);
    const data: any = response.data;
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      bookingId: data.BookingId || data.bookingId,
      condotelId: data.CondotelId || data.condotelId,
      customerId: data.CustomerId || data.customerId,
      startDate: data.StartDate || data.startDate,
      endDate: data.EndDate || data.endDate,
      totalPrice: data.TotalPrice !== undefined ? data.TotalPrice : data.totalPrice,
      status: data.Status || data.status,
      promotionId: data.PromotionId !== undefined ? data.PromotionId : data.promotionId,
      isUsingRewardPoints: data.IsUsingRewardPoints !== undefined ? data.IsUsingRewardPoints : data.isUsingRewardPoints,
      createdAt: data.CreatedAt || data.createdAt,
      condotelName: data.CondotelName || data.condotelName,
      condotelImageUrl: data.CondotelImageUrl || data.condotelImageUrl,
      condotelPricePerNight: data.CondotelPricePerNight !== undefined ? data.CondotelPricePerNight : data.condotelPricePerNight,
      customerName: data.CustomerName || data.customerName,
      customerEmail: data.CustomerEmail || data.customerEmail,
    };
  },
};

export default bookingAPI;

