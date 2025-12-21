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
  condotelId?: number;
  condotelName?: string;
  userId?: number; // ID của user sở hữu voucher (null = voucher công khai)
}

// Helper function để normalize voucher từ PascalCase sang camelCase
const normalizeVoucher = (item: any): VoucherDTO => {
  const normalized: VoucherDTO = {
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
    isActive: item.IsActive !== undefined 
      ? item.IsActive 
      : (item.Status || item.status || "").toLowerCase() === "active",
    usageLimit: item.UsageLimit !== undefined ? item.UsageLimit : item.usageLimit,
    usedCount: item.UsedCount !== undefined ? item.UsedCount : item.usedCount,
    minimumOrderAmount: item.MinimumOrderAmount !== undefined ? item.MinimumOrderAmount : item.minimumOrderAmount,
    createdAt: item.CreatedAt || item.createdAt,
    updatedAt: item.UpdatedAt || item.updatedAt,
  };
  
  // Add additional fields from response (condotelName, condotelId)
  if (item.CondotelName || item.condotelName) {
    normalized.condotelName = item.CondotelName || item.condotelName;
  }
  if (item.CondotelID || item.condotelID || item.condotelId) {
    normalized.condotelId = item.CondotelID || item.condotelID || item.condotelId;
  }
  if (item.UserID || item.userId || item.UserId) {
    normalized.userId = item.UserID || item.userId || item.UserId;
  }
  
  return normalized;
};

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
// Theo spec: GET /api/host/settings/voucher trả về { settingID, hostID, discountAmount, discountPercentage, autoGenerate, validMonths, usageLimit }
export interface HostVoucherSettingDTO {
  settingID?: number; // ID của setting
  hostID?: number; // ID của host
  discountAmount?: number; // Giảm giá theo số tiền (0 - 100,000,000)
  discountPercentage?: number; // Giảm giá theo % (0 - 100)
  autoGenerate: boolean; // BẮT BUỘC: Bật/tắt tự động phát voucher
  validMonths: number; // BẮT BUỘC: Thời hạn voucher (1-24 tháng)
  usageLimit?: number; // Optional: Số lần sử dụng (1-1000)
  
  // Backward compatibility fields
  autoGenerateVouchers?: boolean; // Alias cho autoGenerate
  defaultDiscountPercentage?: number; // Alias cho discountPercentage
  defaultDiscountAmount?: number; // Alias cho discountAmount
  defaultUsageLimit?: number; // Alias cho usageLimit
  defaultMinimumOrderAmount?: number;
  voucherPrefix?: string;
  voucherLength?: number;
}

// API Calls
export const voucherAPI = {
  // GET /api/host/vouchers - Lấy tất cả vouchers của host
  // Hỗ trợ pagination: pageNumber, pageSize
  getAll: async (filters?: {
    pageNumber?: number;
    pageSize?: number;
  }): Promise<VoucherDTO[] | { data: VoucherDTO[]; pagination?: any }> => {
    const params: any = {};
    if (filters?.pageNumber) params.pageNumber = filters.pageNumber;
    if (filters?.pageSize) params.pageSize = filters.pageSize;
    
    const response = await axiosClient.get<any>("/host/vouchers", { params });
    const data = response.data;
    
    // Check if response has pagination info
    if (data && typeof data === 'object' && 'pagination' in data) {
      // Paginated response: { data: [...], pagination: {...} }
      let vouchers: any[] = [];
      if (Array.isArray(data.data)) {
        vouchers = data.data;
      } else if (Array.isArray(data)) {
        vouchers = data;
      }
      
      return {
        data: vouchers.map((item: any) => normalizeVoucher(item)),
        pagination: data.pagination,
      };
    }
    
    // Check for success wrapper: { success: true, data: [...], pagination: {...} }
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      let vouchers: any[] = [];
      if (Array.isArray(data.data)) {
        vouchers = data.data;
      }
      
      const result: any = {
        data: vouchers.map((item: any) => normalizeVoucher(item)),
      };
      
      if ('pagination' in data) {
        result.pagination = data.pagination;
      }
      
      return result;
    }
    
    // Legacy format: just array or { data: [...] }
    const vouchers = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    // Normalize each voucher from PascalCase to camelCase
    return vouchers.map((item: any) => normalizeVoucher(item));
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
    return normalizeVoucher(data);
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
    return normalizeVoucher(data);
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
    
    return vouchers.map((item: any) => normalizeVoucher(item));
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
      data: data.Data || data.data ? (Array.isArray(data.Data || data.data) ? (data.Data || data.data).map((item: any) => normalizeVoucher(item)) : []) : undefined,
    };
  },

  // GET /api/tenant/vouchers - Lấy vouchers available cho tenant
  getAvailableForTenant: async (): Promise<VoucherDTO[]> => {
    const response = await axiosClient.get<any>(`/tenant/vouchers`);
    const data = response.data;
    
    // Normalize response (handle both array and object with data property)
    const vouchers = Array.isArray(data) 
      ? data 
      : (data.data || []);
    
    return vouchers.map((item: any) => normalizeVoucher(item));
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
    return vouchers.map((item: any) => normalizeVoucher(item));
  },

  // ========== VOUCHER SETTINGS APIs ==========
  // GET /api/host/settings/voucher - Lấy cấu hình auto generate voucher của host hiện tại
  // Response: { success: true, data: { settingID, hostID, discountAmount, discountPercentage, autoGenerate, validMonths, usageLimit } } hoặc { success: true, data: null }
  getSettings: async (): Promise<HostVoucherSettingDTO | null> => {
    const response = await axiosClient.get<any>("/host/settings/voucher");
    const responseData = response.data;
    
    // Backend trả về { success: true, data: {...} } hoặc { success: true, data: null }
    const data = responseData.data;
    
    // Nếu data là null, trả về null
    if (!data) {
      return null;
    }
    
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      settingID: data.SettingID || data.settingID,
      hostID: data.HostID || data.hostID,
      discountAmount: data.DiscountAmount !== undefined && data.DiscountAmount !== null ? data.DiscountAmount : data.discountAmount,
      discountPercentage: data.DiscountPercentage !== undefined && data.DiscountPercentage !== null ? data.DiscountPercentage : data.discountPercentage,
      autoGenerate: data.AutoGenerate !== undefined ? data.AutoGenerate : (data.autoGenerate !== undefined ? data.autoGenerate : false),
      validMonths: data.ValidMonths !== undefined ? data.ValidMonths : data.validMonths,
      usageLimit: data.UsageLimit !== undefined ? data.UsageLimit : data.usageLimit,
      // Backward compatibility
      autoGenerateVouchers: data.AutoGenerate !== undefined ? data.AutoGenerate : (data.autoGenerate !== undefined ? data.autoGenerate : false),
      defaultDiscountPercentage: data.DiscountPercentage !== undefined && data.DiscountPercentage !== null ? data.DiscountPercentage : data.discountPercentage,
      defaultDiscountAmount: data.DiscountAmount !== undefined && data.DiscountAmount !== null ? data.DiscountAmount : data.discountAmount,
      defaultUsageLimit: data.UsageLimit !== undefined ? data.UsageLimit : data.usageLimit,
    };
  },

  // POST /api/host/settings/voucher - Lưu cài đặt tự động phát voucher khi booking completed
  // Request: { discountAmount?, discountPercentage?, autoGenerate (BẮT BUỘC), validMonths (BẮT BUỘC), usageLimit? }
  // Validation: Phải có ít nhất một trong hai: DiscountAmount HOẶC DiscountPercentage
  // Response: { success: true, message: "...", data: { settingID, hostID, discountAmount, discountPercentage, autoGenerate, validMonths, usageLimit } }
  saveSettings: async (settings: HostVoucherSettingDTO): Promise<HostVoucherSettingDTO> => {
    // Map camelCase sang PascalCase để khớp với backend C# DTO
    const requestData: any = {};
    
    // BẮT BUỘC: autoGenerate
    requestData.AutoGenerate = settings.autoGenerate !== undefined ? settings.autoGenerate : settings.autoGenerateVouchers;
    
    // BẮT BUỘC: validMonths
    if (settings.validMonths !== undefined) {
      requestData.ValidMonths = settings.validMonths;
    }
    
    // Optional: discountAmount (0 - 100,000,000)
    if (settings.discountAmount !== undefined) {
      requestData.DiscountAmount = settings.discountAmount;
    } else if (settings.defaultDiscountAmount !== undefined) {
      requestData.DiscountAmount = settings.defaultDiscountAmount;
    }
    
    // Optional: discountPercentage (0 - 100)
    if (settings.discountPercentage !== undefined) {
      requestData.DiscountPercentage = settings.discountPercentage;
    } else if (settings.defaultDiscountPercentage !== undefined) {
      requestData.DiscountPercentage = settings.defaultDiscountPercentage;
    }
    
    // Optional: usageLimit (1 - 1000)
    if (settings.usageLimit !== undefined) {
      requestData.UsageLimit = settings.usageLimit;
    } else if (settings.defaultUsageLimit !== undefined) {
      requestData.UsageLimit = settings.defaultUsageLimit;
    }
    
    const response = await axiosClient.post<any>("/host/settings/voucher", requestData);
    const responseData = response.data;
    
    // Backend trả về { success: true, message: "...", data: {...} }
    const data = responseData.data || responseData;
    
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      settingID: data.SettingID || data.settingID,
      hostID: data.HostID || data.hostID,
      discountAmount: data.DiscountAmount !== undefined && data.DiscountAmount !== null ? data.DiscountAmount : data.discountAmount,
      discountPercentage: data.DiscountPercentage !== undefined && data.DiscountPercentage !== null ? data.DiscountPercentage : data.discountPercentage,
      autoGenerate: data.AutoGenerate !== undefined ? data.AutoGenerate : data.autoGenerate,
      validMonths: data.ValidMonths !== undefined ? data.ValidMonths : data.validMonths,
      usageLimit: data.UsageLimit !== undefined ? data.UsageLimit : data.usageLimit,
      // Backward compatibility
      autoGenerateVouchers: data.AutoGenerate !== undefined ? data.AutoGenerate : data.autoGenerate,
      defaultDiscountPercentage: data.DiscountPercentage !== undefined && data.DiscountPercentage !== null ? data.DiscountPercentage : data.discountPercentage,
      defaultDiscountAmount: data.DiscountAmount !== undefined && data.DiscountAmount !== null ? data.DiscountAmount : data.discountAmount,
      defaultUsageLimit: data.UsageLimit !== undefined ? data.UsageLimit : data.usageLimit,
    };
  },
};

export default voucherAPI;

