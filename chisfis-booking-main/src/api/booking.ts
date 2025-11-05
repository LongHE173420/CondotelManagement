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
}

export interface CreateBookingDTO {
  condotelId: number;
  startDate: string; // YYYY-MM-DD (DateOnly)
  endDate: string; // YYYY-MM-DD (DateOnly)
  promotionId?: number;
  isUsingRewardPoints?: boolean;
}

export interface UpdateBookingDTO {
  bookingId: number;
  startDate?: string;
  endDate?: string;
  promotionId?: number;
  isUsingRewardPoints?: boolean;
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
    };

    if (booking.promotionId !== undefined) {
      requestData.PromotionId = booking.promotionId;
    }
    if (booking.isUsingRewardPoints !== undefined) {
      requestData.IsUsingRewardPoints = booking.isUsingRewardPoints;
    }

    console.log("📤 Creating booking with data:", JSON.stringify(requestData, null, 2));

    const response = await axiosClient.post<any>("/booking", requestData);
    console.log("✅ Booking created successfully:", response.data);

    // Normalize response từ backend (PascalCase -> camelCase)
    const data: any = response.data;
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
};

export default bookingAPI;

