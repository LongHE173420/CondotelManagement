import axiosClient from "./axiosClient";
import logger from "utils/logger";

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
  bookingDate?: string; // DateTime - Ngày đặt (mới thêm cho host bookings)
  canRefund?: boolean; // Field từ backend để check xem booking có thể hoàn tiền không
  refundStatus?: string | null; // "Pending", "Refunded", "Completed", hoặc null (chưa có refund request)
  
  // Thông tin condotel (nếu backend trả về khi join)
  condotelName?: string;
  condotelImageUrl?: string;
  condotelPricePerNight?: number;
  
  // Thông tin customer (nếu backend trả về khi join - cho host)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string; // Số điện thoại khách hàng (mới thêm cho host bookings)
}

export interface ServicePackageBookingItem {
  serviceId: number;
  quantity: number;
}

export interface CreateBookingDTO {
  condotelId: number;
  startDate: string; // YYYY-MM-DD (DateOnly)
  endDate: string; // YYYY-MM-DD (DateOnly)
  promotionId?: number;
  voucherCode?: string; // Mã voucher để validate và áp dụng
  servicePackages?: ServicePackageBookingItem[]; // Danh sách service packages với quantity
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

// API Response Types (support both PascalCase and camelCase from backend)
interface BookingResponseRaw {
  BookingId?: number;
  bookingId?: number;
  CondotelId?: number;
  condotelId?: number;
  CustomerId?: number;
  customerId?: number;
  StartDate?: string;
  startDate?: string;
  EndDate?: string;
  endDate?: string;
  TotalPrice?: number;
  totalPrice?: number;
  Status?: string;
  status?: string;
  PromotionId?: number;
  promotionId?: number;
  IsUsingRewardPoints?: boolean;
  isUsingRewardPoints?: boolean;
  CreatedAt?: string;
  createdAt?: string;
  BookingDate?: string; // Ngày đặt (mới thêm cho host bookings)
  bookingDate?: string;
  CanRefund?: boolean;
  canRefund?: boolean;
  RefundStatus?: string | null;
  refundStatus?: string | null;
  CondotelName?: string;
  condotelName?: string;
  CondotelImageUrl?: string;
  condotelImageUrl?: string;
  CondotelPricePerNight?: number;
  condotelPricePerNight?: number;
  CustomerName?: string;
  customerName?: string;
  CustomerEmail?: string;
  customerEmail?: string;
  CustomerPhone?: string; // Số điện thoại khách hàng (mới thêm cho host bookings)
  customerPhone?: string;
}

// Helper function to normalize booking response
const normalizeBooking = (item: BookingResponseRaw): BookingDTO => {
  return {
    bookingId: item.BookingId ?? item.bookingId ?? 0,
    condotelId: item.CondotelId ?? item.condotelId ?? 0,
    customerId: item.CustomerId ?? item.customerId ?? 0,
    startDate: item.StartDate ?? item.startDate ?? "",
    endDate: item.EndDate ?? item.endDate ?? "",
    totalPrice: item.TotalPrice ?? item.totalPrice,
    status: item.Status ?? item.status ?? "",
    promotionId: item.PromotionId ?? item.promotionId,
    isUsingRewardPoints: item.IsUsingRewardPoints ?? item.isUsingRewardPoints ?? false,
    createdAt: item.CreatedAt ?? item.createdAt ?? "",
    bookingDate: item.BookingDate ?? item.bookingDate,
    canRefund: item.CanRefund ?? item.canRefund,
    refundStatus: item.RefundStatus ?? item.refundStatus ?? null,
    condotelName: item.CondotelName ?? item.condotelName,
    condotelImageUrl: item.CondotelImageUrl ?? item.condotelImageUrl,
    condotelPricePerNight: item.CondotelPricePerNight ?? item.condotelPricePerNight,
    customerName: item.CustomerName ?? item.customerName,
    customerEmail: item.CustomerEmail ?? item.customerEmail,
    customerPhone: item.CustomerPhone ?? item.customerPhone,
  };
};

// API Calls
export const bookingAPI = {
  // GET /api/booking/my - Lấy tất cả bookings của tenant hiện tại
  getMyBookings: async (): Promise<BookingDTO[]> => {
    const response = await axiosClient.get<BookingResponseRaw[]>("/booking/my");
    // Normalize response từ backend (PascalCase -> camelCase)
    return response.data.map(normalizeBooking);
  },

  // GET /api/booking/{id} - Lấy booking theo ID
  getBookingById: async (id: number): Promise<BookingDTO> => {
    const response = await axiosClient.get<BookingResponseRaw>(`/booking/${id}`);
    return normalizeBooking(response.data);
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
    interface BookingRequestData {
      CondotelId: number;
      StartDate: string;
      EndDate: string;
      Status: string;
      CondotelName?: string;
      PromotionId?: number;
      VoucherCode?: string;
      ServicePackages?: Array<{ ServiceId: number; Quantity: number }>;
      IsUsingRewardPoints?: boolean;
    }
    
    const requestData: BookingRequestData = {
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
    if (booking.voucherCode) {
      requestData.VoucherCode = booking.voucherCode;
    }
    if (booking.servicePackages && booking.servicePackages.length > 0) {
      requestData.ServicePackages = booking.servicePackages.map(sp => ({
        ServiceId: sp.serviceId,
        Quantity: sp.quantity,
      }));
    }
    if (booking.isUsingRewardPoints !== undefined) {
      requestData.IsUsingRewardPoints = booking.isUsingRewardPoints;
    }

    logger.debug("Creating booking with data:", requestData);
    logger.debug("Voucher code being sent:", booking.voucherCode || "None");
    logger.debug("Service packages being sent:", booking.servicePackages?.length || 0);

    interface BookingCreateResponse {
      success?: boolean;
      data?: BookingResponseRaw;
      message?: string;
    }

    const response = await axiosClient.post<BookingResponseRaw | BookingCreateResponse>("/booking", requestData);
    logger.debug("Booking created successfully:", response.data);

    // Backend returns result with nested Data property (ServiceResult pattern)
    // Response structure: { success: true, data: BookingDTO, message: ... }
    // Or direct BookingDTO if CreatedAtAction returns it directly
    const responseData = response.data as BookingCreateResponse | BookingResponseRaw;
    
    // Extract booking data - could be in responseData.data or responseData directly
    const data = ('data' in responseData && responseData.data) 
      ? responseData.data 
      : (responseData as BookingResponseRaw);
    
    logger.debug("Extracted booking data:", data);
    
    // Normalize response từ backend (PascalCase -> camelCase)
    const normalized = normalizeBooking(data);
    if (!normalized.bookingId) {
      logger.error("BookingId not found in response:", responseData);
      throw new Error("Booking created but BookingId not found in response");
    }
    
    return normalized;
  },

  // PUT /api/booking/{id} - Cập nhật booking
  updateBooking: async (
    id: number,
    booking: UpdateBookingDTO
  ): Promise<BookingDTO> => {
    // Map camelCase sang PascalCase
    interface BookingUpdateRequestData {
      BookingId: number;
      StartDate?: string;
      EndDate?: string;
      PromotionId?: number;
      IsUsingRewardPoints?: boolean;
    }

    const requestData: BookingUpdateRequestData = {
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

    const response = await axiosClient.put<BookingResponseRaw>(`/booking/${id}`, requestData);
    return normalizeBooking(response.data);
  },

  // DELETE /api/booking/{id} - Hủy booking
  cancelBooking: async (id: number): Promise<void> => {
    await axiosClient.delete(`/booking/${id}`);
  },

  // POST /api/booking/{id}/refund - Yêu cầu hoàn tiền cho booking đã hủy
  refundBooking: async (
    id: number, 
    bankInfo?: { bankName: string; accountNumber: string; accountHolder: string }
  ): Promise<{ success: boolean; message?: string; data?: any; bankInfo?: any }> => {
    try {
      // Nếu có thông tin ngân hàng, gửi kèm trong body
      // Backend expect: BankCode (không phải BankName), AccountNumber, AccountHolder
      const payload = bankInfo ? {
        BankCode: bankInfo.bankName, // bankName từ frontend là mã ngân hàng (VCB, MB, etc.)
        AccountNumber: bankInfo.accountNumber,
        AccountHolder: bankInfo.accountHolder,
      } : {};
      
      // Log payload (ẩn thông tin nhạy cảm)
      console.log("📤 Sending refund request:", {
        bookingId: id,
        payload: {
          BankCode: payload.BankCode,
          AccountNumber: payload.AccountNumber ? payload.AccountNumber.substring(0, 3) + "***" : undefined,
          AccountHolder: payload.AccountHolder ? payload.AccountHolder.substring(0, 3) + "***" : undefined,
        },
        hasBankInfo: !!bankInfo,
        bankInfoProvided: {
          bankName: bankInfo?.bankName,
          hasAccountNumber: !!bankInfo?.accountNumber,
          hasAccountHolder: !!bankInfo?.accountHolder,
        }
      });
      
      // Log full payload để debug (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        console.log("📤 Full payload (dev only):", JSON.stringify(payload, null, 2));
      }
      
      const response = await axiosClient.post<any>(`/booking/${id}/refund`, payload);
      const data = response.data;
      
      console.log("📥 Refund API response:", data);
      console.log("📥 Full response data:", JSON.stringify(data, null, 2));
      
      // Log để verify bank info có được gửi và backend có nhận được không
      if (bankInfo) {
        const responseData = data.Data || data.data || {};
        // Backend trả về BankInfo object với BankCode, AccountNumber, AccountHolder
        const receivedBankInfo = responseData.BankInfo || responseData.bankInfo || {};
        
        console.log("🔍 Verifying bank info in request:", {
          sent: {
            BankCode: payload.BankCode,
            AccountNumber: payload.AccountNumber ? payload.AccountNumber.substring(0, 3) + "***" : undefined,
            AccountHolder: payload.AccountHolder ? payload.AccountHolder.substring(0, 3) + "***" : undefined,
          },
          received: {
            BankCode: receivedBankInfo.BankCode || receivedBankInfo.bankCode,
            AccountNumber: receivedBankInfo.AccountNumber || receivedBankInfo.accountNumber 
              ? (receivedBankInfo.AccountNumber || receivedBankInfo.accountNumber).substring(0, 3) + "***" 
              : undefined,
            AccountHolder: receivedBankInfo.AccountHolder || receivedBankInfo.accountHolder
              ? (receivedBankInfo.AccountHolder || receivedBankInfo.accountHolder).substring(0, 3) + "***"
              : undefined,
          },
          responseData: responseData,
          responseSuccess: data.Success !== undefined ? data.Success : data.success,
          responseMessage: data.Message || data.message,
        });
        
        // Verify bank info được lưu
        const receivedBankCode = receivedBankInfo.BankCode || receivedBankInfo.bankCode;
        if (receivedBankCode) {
          console.log("✅ Bank info đã được lưu vào database và trả về trong response:", {
            BankCode: receivedBankCode,
            hasAccountNumber: !!(receivedBankInfo.AccountNumber || receivedBankInfo.accountNumber),
            hasAccountHolder: !!(receivedBankInfo.AccountHolder || receivedBankInfo.accountHolder),
          });
        } else {
          console.warn("⚠️ Backend response không chứa bank info. Có thể backend chưa lưu vào database.");
        }
      }
      
      // Backend trả về ServiceResult: { Success: bool, Message: string, Data?: any }
      // Data có thể chứa BankInfo object với BankCode, AccountNumber, AccountHolder
      const responseData = data.Data || data.data || {};
      return {
        success: data.Success !== undefined ? data.Success : data.success !== undefined ? data.success : true,
        message: data.Message || data.message,
        data: responseData,
        // Thêm bankInfo để dễ truy cập
        bankInfo: responseData.BankInfo || responseData.bankInfo || null,
      };
    } catch (error: any) {
      console.error("❌ Error in refundBooking API:", error);
      console.error("❌ Error response:", error.response?.data);
      
      // Nếu có response từ server, trả về message từ server
      if (error.response?.data) {
        const serverData = error.response.data;
        return {
          success: false,
          message: serverData.Message || serverData.message || serverData.title || "Không thể gửi yêu cầu hoàn tiền",
          data: serverData.Data || serverData.data,
        };
      }
      
      // Nếu không có response, throw error để handle ở component
      throw error;
    }
  },

  // ========== HOST BOOKING APIs ==========
  // GET /api/host/booking - Lấy tất cả bookings của host hiện tại
  // Hỗ trợ các query parameters:
  // - searchTerm: Tìm kiếm trong tên khách hàng, tên condotel, email, phone
  // - status: Lọc theo status (Pending, Confirmed, Cancelled, Completed)
  // - bookingDateFrom, bookingDateTo: Lọc theo khoảng ngày đặt (YYYY-MM-DD)
  // - startDateFrom, startDateTo: Lọc theo ngày check-in (YYYY-MM-DD)
  // - condotelId: Lọc theo condotel ID
  // - sortBy: Sắp xếp theo bookingDate, startDate, endDate, totalPrice
  // - sortDescending: true/false - Sắp xếp tăng/giảm dần
  getHostBookings: async (filters?: {
    searchTerm?: string;
    status?: string;
    bookingDateFrom?: string;
    bookingDateTo?: string;
    startDateFrom?: string;
    startDateTo?: string;
    condotelId?: number;
    sortBy?: "bookingDate" | "startDate" | "endDate" | "totalPrice";
    sortDescending?: boolean;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<BookingDTO[] | { data: BookingDTO[]; pagination?: any }> => {
    const params: any = {};
    
    // Thêm các query parameters nếu có
    if (filters) {
      if (filters.searchTerm) params.searchTerm = filters.searchTerm;
      if (filters.status) params.status = filters.status;
      if (filters.bookingDateFrom) params.bookingDateFrom = filters.bookingDateFrom;
      if (filters.bookingDateTo) params.bookingDateTo = filters.bookingDateTo;
      if (filters.startDateFrom) params.startDateFrom = filters.startDateFrom;
      if (filters.startDateTo) params.startDateTo = filters.startDateTo;
      if (filters.condotelId !== undefined) params.condotelId = filters.condotelId;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortDescending !== undefined) params.sortDescending = filters.sortDescending;
      if (filters.pageNumber) params.pageNumber = filters.pageNumber;
      if (filters.pageSize) params.pageSize = filters.pageSize;
    }
    
    console.log("🔍 API Call - /host/booking with params:", params);
    const response = await axiosClient.get<any>("/host/booking", { params });
    console.log("🔍 API Response:", response.data);
    
    // Check if response has pagination info
    if (response.data && typeof response.data === 'object' && 'pagination' in response.data) {
      // Paginated response: { data: [...], pagination: {...} }
      let data: any[] = [];
      if (Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      console.log("✅ Paginated response - data:", data.length, "items, pagination:", response.data.pagination);
      
      return {
        data: data.map((item: any) => normalizeBooking(item)),
        pagination: response.data.pagination,
      };
    }
    
    // Check for success wrapper: { success: true, data: [...], pagination: {...} }
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      let data: any[] = [];
      if (Array.isArray(response.data.data)) {
        data = response.data.data;
      }
      
      const result: any = {
        data: data.map((item: any) => normalizeBooking(item)),
      };
      
      if ('pagination' in response.data) {
        result.pagination = response.data.pagination;
        console.log("✅ Success wrapper with pagination - data:", data.length, "items, pagination:", response.data.pagination);
      } else {
        console.log("✅ Success wrapper without pagination - data:", data.length, "items");
      }
      
      return result;
    }
    
    // Legacy format: just array or { data: [...] }
    let data: any[] = [];
    if (Array.isArray(response.data)) {
      data = response.data;
      console.log("⚠️ Legacy format - array with", data.length, "items");
    } else if (response.data && Array.isArray(response.data.data)) {
      data = response.data.data;
      console.log("⚠️ Legacy format - data array with", data.length, "items");
    } else if (response.data && typeof response.data === 'object') {
      // If response.data is a single object, wrap it in array
      data = [response.data];
      console.log("⚠️ Legacy format - single object wrapped in array");
    }
    
    if (!Array.isArray(data)) {
      console.warn("❌ getHostBookings: response.data is not an array:", response.data);
      return [];
    }
    
    return data.map((item: any) => normalizeBooking(item));
  },

  // GET /api/host/booking/customer/{customerId} - Lấy bookings theo customer
  getHostBookingsByCustomer: async (customerId: number): Promise<BookingDTO[]> => {
    const response = await axiosClient.get<any>(`/host/booking/customer/${customerId}`);
    // Normalize response từ backend (PascalCase -> camelCase)
    // Handle both array and object with data property
    let data: any[] = [];
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      data = response.data.data;
    } else if (response.data && typeof response.data === 'object') {
      // If response.data is a single object, wrap it in array
      data = [response.data];
    }
    
    if (!Array.isArray(data)) {
      console.warn("getHostBookingsByCustomer: response.data is not an array:", response.data);
      return [];
    }
    
    return data.map((item: any) => normalizeBooking(item));
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
      canRefund: data.CanRefund !== undefined ? data.CanRefund : data.canRefund,
      refundStatus: data.RefundStatus !== undefined ? (data.RefundStatus || null) : (data.refundStatus !== undefined ? (data.refundStatus || null) : null),
      condotelName: data.CondotelName || data.condotelName,
      condotelImageUrl: data.CondotelImageUrl || data.condotelImageUrl,
      condotelPricePerNight: data.CondotelPricePerNight !== undefined ? data.CondotelPricePerNight : data.condotelPricePerNight,
      customerName: data.CustomerName || data.customerName,
      customerEmail: data.CustomerEmail || data.customerEmail,
    };
  },

  // GET /api/booking/{id}/can-refund - Check xem booking có thể hoàn tiền không (Option 2)
  checkCanRefund: async (id: number): Promise<{ canRefund: boolean; message?: string }> => {
    const response = await axiosClient.get<any>(`/booking/${id}/can-refund`);
    const data = response.data;
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      canRefund: data.CanRefund !== undefined ? data.CanRefund : data.canRefund,
      message: data.Message || data.message,
    };
  },
};

export default bookingAPI;

