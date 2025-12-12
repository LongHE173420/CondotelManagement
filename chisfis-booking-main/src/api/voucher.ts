import axiosClient from "./axiosClient";

// DTOs từ backend Voucher
export interface VoucherDTO {
  voucherId: number;
  code: string;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
  minimumOrderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherCreateDTO {
  code: string;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  usageLimit?: number;
  minimumOrderAmount?: number;
  condotelId?: number; // ID của condotel mà voucher áp dụng
}

// Host Voucher Settings DTO
// Theo spec: autoGenerate, discountAmount/Percentage, validMonths, usageLimit
export interface HostVoucherSettingDTO {
  autoGenerateVouchers?: boolean; // autoGenerate
  defaultDiscountPercentage?: number; // discountPercentage
  defaultDiscountAmount?: number; // discountAmount
  validMonths?: number; // Thời hạn voucher (tháng) - theo spec
  defaultUsageLimit?: number; // usageLimit
  defaultMinimumOrderAmount?: number;
  voucherPrefix?: string;
  voucherLength?: number;
  // Add other settings as needed based on backend
}

// API Calls
export const voucherAPI = {
  // GET /api/host/vouchers - Lấy tất cả vouchers của host
  getAll: async (): Promise<VoucherDTO[]> => {
    const response = await axiosClient.get<any>("/host/vouchers");
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const vouchers = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    // Normalize each voucher from PascalCase to camelCase
    return vouchers.map((item: any) => ({
      voucherId: item.VoucherId || item.voucherId,
      code: item.Code || item.code,
      description: item.Description || item.description,
      discountPercentage: item.DiscountPercentage !== undefined ? item.DiscountPercentage : item.discountPercentage,
      discountAmount: item.DiscountAmount !== undefined ? item.DiscountAmount : item.discountAmount,
      startDate: item.StartDate || item.startDate,
      endDate: item.EndDate || item.endDate,
      isActive: item.IsActive !== undefined ? item.IsActive : item.isActive,
      usageLimit: item.UsageLimit !== undefined ? item.UsageLimit : item.usageLimit,
      usedCount: item.UsedCount !== undefined ? item.UsedCount : item.usedCount,
      minimumOrderAmount: item.MinimumOrderAmount !== undefined ? item.MinimumOrderAmount : item.minimumOrderAmount,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
    }));
  },

  // POST /api/host/vouchers - Tạo voucher mới
  // Theo spec: CondotelID (bắt buộc), Code (bắt buộc, unique), StartDate < EndDate, 
  // Ít nhất một trong: DiscountAmount hoặc DiscountPercentage, tự động set Status = "Active"
  create: async (voucher: VoucherCreateDTO): Promise<VoucherDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {
      Code: voucher.code,
      StartDate: voucher.startDate,
      EndDate: voucher.endDate,
    };
    
    // CondotelID là bắt buộc theo spec
    if (voucher.condotelId) {
      requestData.CondotelId = voucher.condotelId;
    }
    
    // Ít nhất một trong: DiscountAmount hoặc DiscountPercentage
    if (voucher.discountPercentage !== undefined) {
      requestData.DiscountPercentage = voucher.discountPercentage;
    }
    if (voucher.discountAmount !== undefined) {
      requestData.DiscountAmount = voucher.discountAmount;
    }
    
    // Optional fields
    if (voucher.description) {
      requestData.Description = voucher.description;
    }
    if (voucher.usageLimit !== undefined) {
      requestData.UsageLimit = voucher.usageLimit;
    }
    if (voucher.minimumOrderAmount !== undefined) {
      requestData.MinimumOrderAmount = voucher.minimumOrderAmount;
    }
    // Backend tự động set Status = "Active" khi tạo
    
    const response = await axiosClient.post<VoucherDTO>("/host/vouchers", requestData);
    const data = response.data;
    
    // Normalize response từ PascalCase sang camelCase
    return {
      voucherId: data.VoucherId || data.voucherId,
      code: data.Code || data.code,
      description: data.Description || data.description,
      discountPercentage: data.DiscountPercentage !== undefined ? data.DiscountPercentage : data.discountPercentage,
      discountAmount: data.DiscountAmount !== undefined ? data.DiscountAmount : data.discountAmount,
      startDate: data.StartDate || data.startDate,
      endDate: data.EndDate || data.endDate,
      isActive: data.IsActive !== undefined ? data.IsActive : data.isActive,
      usageLimit: data.UsageLimit !== undefined ? data.UsageLimit : data.usageLimit,
      usedCount: data.UsedCount !== undefined ? data.UsedCount : data.usedCount,
      minimumOrderAmount: data.MinimumOrderAmount !== undefined ? data.MinimumOrderAmount : data.minimumOrderAmount,
      createdAt: data.CreatedAt || data.createdAt,
      updatedAt: data.UpdatedAt || data.updatedAt,
    };
  },

  // PUT /api/host/vouchers/{id} - Cập nhật voucher
  // Validation tương tự Create, chỉ cập nhật được voucher thuộc về host
  update: async (
    id: number,
    voucher: VoucherCreateDTO
  ): Promise<VoucherDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {
      Code: voucher.code,
      StartDate: voucher.startDate,
      EndDate: voucher.endDate,
    };
    
    if (voucher.condotelId) {
      requestData.CondotelId = voucher.condotelId;
    }
    
    if (voucher.discountPercentage !== undefined) {
      requestData.DiscountPercentage = voucher.discountPercentage;
    }
    if (voucher.discountAmount !== undefined) {
      requestData.DiscountAmount = voucher.discountAmount;
    }
    
    if (voucher.description) {
      requestData.Description = voucher.description;
    }
    if (voucher.usageLimit !== undefined) {
      requestData.UsageLimit = voucher.usageLimit;
    }
    if (voucher.minimumOrderAmount !== undefined) {
      requestData.MinimumOrderAmount = voucher.minimumOrderAmount;
    }
    if (voucher.isActive !== undefined) {
      requestData.Status = voucher.isActive ? "Active" : "Inactive";
    }
    
    const response = await axiosClient.put<VoucherDTO>(`/host/vouchers/${id}`, requestData);
    const data = response.data;
    
    // Normalize response từ PascalCase sang camelCase
    return {
      voucherId: data.VoucherId || data.voucherId,
      code: data.Code || data.code,
      description: data.Description || data.description,
      discountPercentage: data.DiscountPercentage !== undefined ? data.DiscountPercentage : data.discountPercentage,
      discountAmount: data.DiscountAmount !== undefined ? data.DiscountAmount : data.discountAmount,
      startDate: data.StartDate || data.startDate,
      endDate: data.EndDate || data.endDate,
      isActive: data.IsActive !== undefined ? data.IsActive : data.isActive,
      usageLimit: data.UsageLimit !== undefined ? data.UsageLimit : data.usageLimit,
      usedCount: data.UsedCount !== undefined ? data.UsedCount : data.usedCount,
      minimumOrderAmount: data.MinimumOrderAmount !== undefined ? data.MinimumOrderAmount : data.minimumOrderAmount,
      createdAt: data.CreatedAt || data.createdAt,
      updatedAt: data.UpdatedAt || data.updatedAt,
    };
  },

  // DELETE /api/host/vouchers/{id} - Xóa voucher
  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/host/vouchers/${id}`);
  },

  // GET /api/vouchers/condotel/{condotelId} - Lấy vouchers theo condotel (AllowAnonymous - không cần đăng nhập)
  getByCondotel: async (condotelId: number): Promise<VoucherDTO[]> => {
    const response = await axiosClient.get<any>(`/vouchers/condotel/${condotelId}`);
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const vouchers = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return vouchers.map((item: any) => ({
      voucherId: item.VoucherId || item.voucherId,
      code: item.Code || item.code,
      description: item.Description || item.description,
      discountPercentage: item.DiscountPercentage !== undefined ? item.DiscountPercentage : item.discountPercentage,
      discountAmount: item.DiscountAmount !== undefined ? item.DiscountAmount : item.discountAmount,
      startDate: item.StartDate || item.startDate,
      endDate: item.EndDate || item.endDate,
      isActive: item.IsActive !== undefined ? item.IsActive : item.isActive,
      usageLimit: item.UsageLimit !== undefined ? item.UsageLimit : item.usageLimit,
      usedCount: item.UsedCount !== undefined ? item.UsedCount : item.usedCount,
      minimumOrderAmount: item.MinimumOrderAmount !== undefined ? item.MinimumOrderAmount : item.minimumOrderAmount,
      createdAt: item.CreatedAt || item.createdAt,
      updatedAt: item.UpdatedAt || item.updatedAt,
    }));
  },

  // POST /api/vouchers/auto-create/{bookingId} - Tự động tạo voucher sau khi booking hoàn thành
  autoCreate: async (bookingId: number): Promise<{
    success: boolean;
    message: string;
    data?: VoucherDTO[];
  }> => {
    const response = await axiosClient.post<any>(`/vouchers/auto-create/${bookingId}`);
    const data = response.data;
    
    return {
      success: data.Success !== undefined ? data.Success : data.success !== undefined ? data.success : false,
      message: data.Message || data.message || "",
      data: data.Data || data.data ? (Array.isArray(data.Data || data.data) ? (data.Data || data.data).map((item: any) => ({
        voucherId: item.VoucherId || item.voucherId,
        code: item.Code || item.code,
        description: item.Description || item.description,
        discountPercentage: item.DiscountPercentage !== undefined ? item.DiscountPercentage : item.discountPercentage,
        discountAmount: item.DiscountAmount !== undefined ? item.DiscountAmount : item.discountAmount,
        startDate: item.StartDate || item.startDate,
        endDate: item.EndDate || item.endDate,
        isActive: item.IsActive !== undefined ? item.IsActive : item.isActive,
        usageLimit: item.UsageLimit !== undefined ? item.UsageLimit : item.usageLimit,
        usedCount: item.UsedCount !== undefined ? item.UsedCount : item.usedCount,
        minimumOrderAmount: item.MinimumOrderAmount !== undefined ? item.MinimumOrderAmount : item.minimumOrderAmount,
        createdAt: item.CreatedAt || item.createdAt,
        updatedAt: item.UpdatedAt || item.updatedAt,
      })) : []) : undefined,
    };
  },

  // GET /api/tenant/vouchers - Lấy vouchers available cho tenant
  getAvailableForTenant: async (): Promise<VoucherDTO[]> => {
    const response = await axiosClient.get<VoucherDTO[]>(`/tenant/vouchers`);
    return response.data || [];
  },

  // GET /api/vouchers/my - Lấy vouchers của user hiện tại (cần đăng nhập)
  getMyVouchers: async (): Promise<VoucherDTO[]> => {
    const response = await axiosClient.get<any>("/vouchers/my");
    const responseData = response.data;
    
    // Handle response format: { success: true, data: [...], total: number }
    let vouchers: any[] = [];
    if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData)) {
        vouchers = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        vouchers = responseData.data;
      } else if (responseData.Data && Array.isArray(responseData.Data)) {
        vouchers = responseData.Data;
      }
    }
    
    // Normalize each voucher from backend format to VoucherDTO
    return vouchers.map((item: any) => {
      const normalized: any = {
        voucherId: item.VoucherId || item.voucherId || item.voucherID,
        code: item.Code || item.code,
        description: item.Description || item.description,
        discountPercentage: item.DiscountPercentage !== undefined && item.DiscountPercentage !== null 
          ? item.DiscountPercentage 
          : (item.discountPercentage !== undefined && item.discountPercentage !== null ? item.discountPercentage : undefined),
        discountAmount: item.DiscountAmount !== undefined && item.DiscountAmount !== null
          ? item.DiscountAmount
          : (item.discountAmount !== undefined && item.discountAmount !== null ? item.discountAmount : undefined),
        startDate: item.StartDate || item.startDate,
        endDate: item.EndDate || item.endDate,
        // Map status to isActive: "Active" = true, others = false
        isActive: (item.Status || item.status || "").toLowerCase() === "active",
        usageLimit: item.UsageLimit !== undefined ? item.UsageLimit : item.usageLimit,
        usedCount: item.UsedCount !== undefined ? item.UsedCount : item.usedCount,
        minimumOrderAmount: item.MinimumOrderAmount !== undefined ? item.MinimumOrderAmount : item.minimumOrderAmount,
        createdAt: item.CreatedAt || item.createdAt,
        updatedAt: item.UpdatedAt || item.updatedAt,
      };
      
      // Add additional fields from response (condotelName, etc.)
      if (item.CondotelName || item.condotelName) {
        normalized.condotelName = item.CondotelName || item.condotelName;
      }
      if (item.CondotelID || item.condotelID || item.condotelId) {
        normalized.condotelId = item.CondotelID || item.condotelID || item.condotelId;
      }
      
      return normalized;
    });
  },

  // ========== VOUCHER SETTINGS APIs ==========
  // GET /api/host/settings/voucher - Lấy voucher settings của host
  getSettings: async (): Promise<HostVoucherSettingDTO> => {
    const response = await axiosClient.get<any>("/host/settings/voucher");
    const data = response.data;
    
    // Normalize response từ backend (PascalCase -> camelCase)
    // Theo spec: autoGenerate, discountAmount/Percentage, validMonths, usageLimit
    return {
      autoGenerateVouchers: data.AutoGenerateVouchers !== undefined ? data.AutoGenerateVouchers : data.autoGenerateVouchers,
      defaultDiscountPercentage: data.DefaultDiscountPercentage !== undefined ? data.DefaultDiscountPercentage : data.defaultDiscountPercentage,
      defaultDiscountAmount: data.DefaultDiscountAmount !== undefined ? data.DefaultDiscountAmount : data.defaultDiscountAmount,
      validMonths: data.ValidMonths !== undefined ? data.ValidMonths : data.validMonths,
      defaultUsageLimit: data.DefaultUsageLimit !== undefined ? data.DefaultUsageLimit : data.defaultUsageLimit,
      defaultMinimumOrderAmount: data.DefaultMinimumOrderAmount !== undefined ? data.DefaultMinimumOrderAmount : data.defaultMinimumOrderAmount,
      voucherPrefix: data.VoucherPrefix || data.voucherPrefix,
      voucherLength: data.VoucherLength !== undefined ? data.VoucherLength : data.voucherLength,
    };
  },

  // POST /api/host/settings/voucher - Lưu voucher settings của host
  // Theo spec: Khi autoGenerate = true, tự động tạo voucher cho tất cả condotel của host
  // Gửi email thông báo cho customer, Voucher có thời hạn = validMonths tháng
  saveSettings: async (settings: HostVoucherSettingDTO): Promise<HostVoucherSettingDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {};
    
    if (settings.autoGenerateVouchers !== undefined) {
      requestData.AutoGenerateVouchers = settings.autoGenerateVouchers;
    }
    if (settings.defaultDiscountPercentage !== undefined) {
      requestData.DefaultDiscountPercentage = settings.defaultDiscountPercentage;
    }
    if (settings.defaultDiscountAmount !== undefined) {
      requestData.DefaultDiscountAmount = settings.defaultDiscountAmount;
    }
    if (settings.validMonths !== undefined) {
      requestData.ValidMonths = settings.validMonths;
    }
    if (settings.defaultUsageLimit !== undefined) {
      requestData.DefaultUsageLimit = settings.defaultUsageLimit;
    }
    if (settings.defaultMinimumOrderAmount !== undefined) {
      requestData.DefaultMinimumOrderAmount = settings.defaultMinimumOrderAmount;
    }
    if (settings.voucherPrefix) {
      requestData.VoucherPrefix = settings.voucherPrefix;
    }
    if (settings.voucherLength !== undefined) {
      requestData.VoucherLength = settings.voucherLength;
    }
    
    const response = await axiosClient.post<any>("/host/settings/voucher", requestData);
    const data = response.data;
    
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      autoGenerateVouchers: data.AutoGenerateVouchers !== undefined ? data.AutoGenerateVouchers : data.autoGenerateVouchers,
      defaultDiscountPercentage: data.DefaultDiscountPercentage !== undefined ? data.DefaultDiscountPercentage : data.defaultDiscountPercentage,
      defaultDiscountAmount: data.DefaultDiscountAmount !== undefined ? data.DefaultDiscountAmount : data.defaultDiscountAmount,
      validMonths: data.ValidMonths !== undefined ? data.ValidMonths : data.validMonths,
      defaultUsageLimit: data.DefaultUsageLimit !== undefined ? data.DefaultUsageLimit : data.defaultUsageLimit,
      defaultMinimumOrderAmount: data.DefaultMinimumOrderAmount !== undefined ? data.DefaultMinimumOrderAmount : data.defaultMinimumOrderAmount,
      voucherPrefix: data.VoucherPrefix || data.voucherPrefix,
      voucherLength: data.VoucherLength !== undefined ? data.VoucherLength : data.voucherLength,
    };
  },
};

export default voucherAPI;

