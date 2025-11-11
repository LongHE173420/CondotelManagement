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
};

export default voucherAPI;

