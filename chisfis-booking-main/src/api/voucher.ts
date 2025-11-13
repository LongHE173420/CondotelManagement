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
};

export default voucherAPI;

