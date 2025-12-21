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

  // ========== REFUND REQUESTS APIs ==========
  // GET /api/admin/refund-requests - Lấy danh sách yêu cầu hoàn tiền
  getRefundRequests: async (params?: {
    status?: string;
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[] }> => {
    const response = await axiosClient.get<any>("/admin/refund-requests", { params });
    return response.data;
  },

  // POST /api/admin/refund-requests/{bookingId}/refund - Hoàn tiền tự động
  refundBooking: async (
    bookingId: number,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      `/admin/refund-requests/${bookingId}/refund`,
      reason ? { reason } : {}
    );
    return response.data;
  },

  // POST /api/admin/refund-requests/{bookingId}/confirm-manual - Xác nhận hoàn tiền thủ công (legacy)
  confirmRefundManually: async (
    bookingId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      `/admin/refund-requests/${bookingId}/confirm-manual`
    );
    return response.data;
  },

  // POST /api/admin/refund-requests/{bookingId}/confirm - Xác nhận hoàn tiền thủ công (mới)
  // Lưu ý: Backend expect bookingId, không phải refundRequestId
  confirmRefundRequest: async (
    bookingId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      `/admin/refund-requests/${bookingId}/confirm`
    );
    return response.data;
  },

  // POST /api/admin/refund-requests/{refundRequestId}/reject - Từ chối yêu cầu hoàn tiền
  // Lưu ý: Backend expect refundRequestId, không phải bookingId
  rejectRefundRequest: async (
    refundRequestId: number,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      `/admin/refund-requests/${refundRequestId}/reject`,
      { reason }
    );
    return response.data;
  },

  // ========== ADMIN REPORTS APIs ==========
  // POST /api/admin/reports - Tạo báo cáo
  createReport: async (reportData: AdminReportCreateDTO): Promise<AdminReportResponseDTO> => {
    const response = await axiosClient.post<AdminReportResponseDTO>("/admin/reports", reportData);
    return response.data;
  },

  // GET /api/admin/reports - Lấy tất cả báo cáo
  getAllReports: async (): Promise<AdminReportListDTO[]> => {
    const response = await axiosClient.get<AdminReportListDTO[]>("/admin/reports");
    return response.data;
  },

  // GET /api/admin/reports/{id} - Lấy báo cáo theo ID
  getReportById: async (reportId: number): Promise<AdminReportResponseDTO> => {
    const response = await axiosClient.get<AdminReportResponseDTO>(`/admin/reports/${reportId}`);
    return response.data;
  },

  // GET /api/admin/reports/admin/{adminId} - Lấy báo cáo theo admin
  getReportsByAdmin: async (adminId: number): Promise<AdminReportListDTO[]> => {
    const response = await axiosClient.get<AdminReportListDTO[]>(`/admin/reports/admin/${adminId}`);
    return response.data;
  },

  // GET /api/admin/reports/host/{hostId} - Lấy báo cáo theo host
  getReportsByHost: async (hostId: number): Promise<AdminReportListDTO[]> => {
    const response = await axiosClient.get<AdminReportListDTO[]>(`/admin/reports/host/${hostId}`);
    return response.data;
  },

  // DELETE /api/admin/reports/{id} - Xóa báo cáo
  deleteReport: async (reportId: number): Promise<{ message: string }> => {
    const response = await axiosClient.delete<{ message: string }>(`/admin/reports/${reportId}`);
    return response.data;
  },

  // GET /api/admin/reports/hosts - Lấy tất cả hosts active để frontend chọn
  getHostsForReports: async (): Promise<HostListItemDTO[]> => {
    const response = await axiosClient.get<{ success: boolean; data: HostListItemDTO[] } | HostListItemDTO[]>("/admin/reports/hosts");
    const data = response.data;
    
    // Handle response format: { success: true, data: [...] } or array
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return (data as { success: boolean; data: HostListItemDTO[] }).data;
    } else if (Array.isArray(data)) {
      return data;
    }
    return [];
  },
};

// ========== ADMIN REPORT DTOs ==========
export interface AdminReportCreateDTO {
  reportType: "HostReport" | "RevenueReport" | "AllHostsReport";
  hostId?: number | null; // Optional: null = tất cả hosts, có giá trị = host cụ thể
  fromDate?: string; // Required for HostReport (YYYY-MM-DD)
  toDate?: string; // Required for HostReport (YYYY-MM-DD)
  year?: number; // Required for RevenueReport and AllHostsReport
  month?: number | null; // Optional for RevenueReport and AllHostsReport (1-12)
}

export interface AdminReportResponseDTO {
  reportId: number;
  reportType: string;
  adminId: number;
  adminName?: string;
  hostId?: number;
  hostName?: string;
  fromDate?: string;
  toDate?: string;
  year?: number;
  month?: number;
  fileName: string;
  filePath: string;
  createdAt: string;
  status?: string;
}

export interface AdminReportListDTO {
  reportId: number;
  reportType: string;
  adminId: number;
  adminName?: string;
  hostId?: number;
  hostName?: string;
  fromDate?: string;
  toDate?: string;
  year?: number;
  month?: number;
  fileName: string;
  createdAt: string;
  generatedDate?: string; // DateTime khi tạo báo cáo
  status?: string;
}

export interface HostListItemDTO {
  hostId: number;
  hostName: string;
  companyName?: string;
  email?: string;
  status: string;
}

export interface AdminReportResponseDTO {
  reportId: number;
  reportType: string;
  adminId: number;
  adminName?: string;
  hostId?: number;
  hostName?: string;
  fromDate?: string;
  toDate?: string;
  year?: number;
  month?: number;
  fileName: string;
  filePath: string;
  createdAt: string;
  generatedDate?: string; // DateTime khi tạo báo cáo
  status?: string;
}

export default adminAPI;