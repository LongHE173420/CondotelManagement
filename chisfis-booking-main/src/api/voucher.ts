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
export interface HostVoucherSettingDTO {
  autoGenerateVouchers?: boolean;
  defaultDiscountPercentage?: number;
  defaultDiscountAmount?: number;
  defaultUsageLimit?: number;
  defaultMinimumOrderAmount?: number;
  voucherPrefix?: string;
  voucherLength?: number;
  // Add other settings as needed based on backend
}

// API Calls
export const voucherAPI = {
  // GET /api/host/vouchers - Lấy tất cả vouchers của host
  getAll: async (): Promise<VoucherDTO[]> => {
    const response = await axiosClient.get<VoucherDTO[]>("/host/vouchers");
    return response.data;
  },

  // POST /api/host/vouchers - Tạo voucher mới
  create: async (voucher: VoucherCreateDTO): Promise<VoucherDTO> => {
    const response = await axiosClient.post<VoucherDTO>("/host/vouchers", voucher);
    return response.data;
  },

  // PUT /api/host/vouchers/{id} - Cập nhật voucher
  update: async (
    id: number,
    voucher: VoucherCreateDTO
  ): Promise<VoucherDTO> => {
    const response = await axiosClient.put<VoucherDTO>(`/host/vouchers/${id}`, voucher);
    return response.data;
  },

  // DELETE /api/host/vouchers/{id} - Xóa voucher
  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/host/vouchers/${id}`);
  },

  // GET /api/vouchers/condotel/{condotelId} - Lấy vouchers theo condotel
  getByCondotel: async (condotelId: number): Promise<VoucherDTO[]> => {
    const response = await axiosClient.get<VoucherDTO[]>(`/vouchers/condotel/${condotelId}`);
    return response.data;
  },

  // GET /api/tenant/vouchers - Lấy vouchers available cho tenant
  getAvailableForTenant: async (): Promise<VoucherDTO[]> => {
    const response = await axiosClient.get<VoucherDTO[]>(`/tenant/vouchers`);
    return response.data || [];
  },

  // POST /api/tenant/vouchers/auto-create/{bookingId} - Tự động tạo voucher sau khi booking thành công
  createVoucherAfterBooking: async (bookingId: number): Promise<{
    success: boolean;
    message: string;
    data?: VoucherDTO[];
  }> => {
    const response = await axiosClient.post<any>(`/tenant/vouchers/auto-create/${bookingId}`);
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

  // ========== VOUCHER SETTINGS APIs ==========
  // GET /api/host/settings/voucher - Lấy voucher settings của host
  getSettings: async (): Promise<HostVoucherSettingDTO> => {
    const response = await axiosClient.get<any>("/host/settings/voucher");
    const data = response.data;
    
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      autoGenerateVouchers: data.AutoGenerateVouchers !== undefined ? data.AutoGenerateVouchers : data.autoGenerateVouchers,
      defaultDiscountPercentage: data.DefaultDiscountPercentage !== undefined ? data.DefaultDiscountPercentage : data.defaultDiscountPercentage,
      defaultDiscountAmount: data.DefaultDiscountAmount !== undefined ? data.DefaultDiscountAmount : data.defaultDiscountAmount,
      defaultUsageLimit: data.DefaultUsageLimit !== undefined ? data.DefaultUsageLimit : data.defaultUsageLimit,
      defaultMinimumOrderAmount: data.DefaultMinimumOrderAmount !== undefined ? data.DefaultMinimumOrderAmount : data.defaultMinimumOrderAmount,
      voucherPrefix: data.VoucherPrefix || data.voucherPrefix,
      voucherLength: data.VoucherLength !== undefined ? data.VoucherLength : data.voucherLength,
    };
  },

  // POST /api/host/settings/voucher - Lưu voucher settings của host
  saveSettings: async (settings: HostVoucherSettingDTO): Promise<HostVoucherSettingDTO> => {
    const response = await axiosClient.post<any>("/host/settings/voucher", settings);
    const data = response.data;
    
    // Normalize response từ backend (PascalCase -> camelCase)
    return {
      autoGenerateVouchers: data.AutoGenerateVouchers !== undefined ? data.AutoGenerateVouchers : data.autoGenerateVouchers,
      defaultDiscountPercentage: data.DefaultDiscountPercentage !== undefined ? data.DefaultDiscountPercentage : data.defaultDiscountPercentage,
      defaultDiscountAmount: data.DefaultDiscountAmount !== undefined ? data.DefaultDiscountAmount : data.defaultDiscountAmount,
      defaultUsageLimit: data.DefaultUsageLimit !== undefined ? data.DefaultUsageLimit : data.defaultUsageLimit,
      defaultMinimumOrderAmount: data.DefaultMinimumOrderAmount !== undefined ? data.DefaultMinimumOrderAmount : data.defaultMinimumOrderAmount,
      voucherPrefix: data.VoucherPrefix || data.voucherPrefix,
      voucherLength: data.VoucherLength !== undefined ? data.VoucherLength : data.voucherLength,
    };
  },
};

export default voucherAPI;

