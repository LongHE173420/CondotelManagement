import axiosClient from "./axiosClient";

// 1. DTO NHẬN VỀ (Hiển thị)
export interface AdminUserDTO {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  roleName: string; // Backend trả về 'roleName'
  status: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  imageUrl?: string;
  createdAt?: string;
}

// 2. DTO GỬI ĐI (Tạo mới)
// SỬA: Dùng roleId: number
export interface AdminCreateUserDTO {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleId: number; // Phải là roleId
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

// 3. DTO GỬI ĐI (Cập nhật)
// SỬA: Dùng roleId: number
export interface AdminUpdateUserDTO {
  fullName?: string;
  email?: string;
  phone?: string;
  roleId?: number; // Phải là roleId
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

// 4. DTO TRẢ VỀ (Khi tạo/sửa)
// THÊM: Interface này bị thiếu
export interface AdminUserResponse {
  message: string;
  user: AdminUserDTO;
}

// (Các DTO khác giữ nguyên)
export interface AdminResetPasswordDTO {
  newPassword: string;
}
export interface UpdateUserStatusDTO {
  status: string;
}


// --- API Calls ---
export const adminAPI = {
  // GET /api/admin/users
  getAllUsers: async (): Promise<AdminUserDTO[]> => {
    const response = await axiosClient.get<AdminUserDTO[]>("/admin/users");
    return response.data;
  },

  // GET /api/admin/users/{userId}
  getUserById: async (userId: number): Promise<AdminUserDTO> => {
    const response = await axiosClient.get<AdminUserDTO>(`/admin/users/${userId}`);
    return response.data;
  },

  // POST /api/admin/users
  // SỬA: Kiểu trả về là AdminUserResponse
  createUser: async (userData: AdminCreateUserDTO): Promise<AdminUserResponse> => {
    const response = await axiosClient.post<AdminUserResponse>("/admin/users", userData);
    return response.data;
  },

  // PUT /api/admin/users/{userId}
  // SỬA: Kiểu trả về là AdminUserResponse
  updateUser: async (
    userId: number,
    userData: AdminUpdateUserDTO
  ): Promise<AdminUserResponse> => {
    const response = await axiosClient.put<AdminUserResponse>(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // PATCH /api/admin/users/{userId}/reset-password
  resetPassword: async (
    userId: number,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await axiosClient.patch<{ message: string }>(
      `/admin/users/${userId}/reset-password`,
      { newPassword }
    );
    return response.data;
  },

  // PATCH /api/admin/users/{userId}/status
  updateUserStatus: async (
    userId: number,
    status: string
  ): Promise<{ message: string }> => {
    const response = await axiosClient.patch<{ message: string }>(
      `/admin/users/${userId}/status`,
      { status }
    );
    return response.data;
  },

  // DELETE /api/admin/users/{userId}
  // SỬA: Kiểu trả về là { message: string }
  deleteUser: async (userId: number): Promise<{ message: string }> => {
    const response = await axiosClient.delete<{ message: string }>(`/admin/users/${userId}`);
    return response.data;
  },

  // ========== ADMIN REFUND APIs ==========
  // GET /api/admin/refunds - Lấy danh sách yêu cầu hoàn tiền với filter
  getRefundRequests: async (params?: {
    searchTerm?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; total?: number }> => {
    const response = await axiosClient.get<any>("/admin/refunds", { params });
    // Backend trả về { success: true, data: [...], total: number }
    const responseData = response.data;
    return {
      data: responseData.data || responseData || [],
      total: responseData.total,
    };
  },

  // POST /api/admin/bookings/{bookingId}/refund - Admin hoàn tiền tự động qua Cas Transfer API
  refundBooking: async (bookingId: number, reason?: string): Promise<any> => {
    const response = await axiosClient.post<any>(
      `/admin/bookings/${bookingId}/refund`,
      reason ? { Reason: reason } : null
    );
    return response.data;
  },

  // POST /api/admin/refunds/{bookingId}/confirm - Xác nhận đã chuyển tiền thủ công
  confirmRefundManually: async (bookingId: number): Promise<any> => {
    const response = await axiosClient.post<any>(`/admin/refunds/${bookingId}/confirm`);
    return response.data;
  },
};

export default adminAPI;