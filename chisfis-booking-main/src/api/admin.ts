import axiosClient from "./axiosClient";

// DTOs từ backend Admin
export interface AdminUserDTO {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  roleName: string;
  status: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface AdminCreateUserDTO {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleName: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface AdminUpdateUserDTO {
  fullName?: string;
  email?: string;
  phone?: string;
  roleName?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface AdminResetPasswordDTO {
  newPassword: string;
}

export interface UpdateUserStatusDTO {
  status: string;
}

// API Calls
export const adminAPI = {
  // GET /api/admin/users - Lấy tất cả users (chỉ Admin)
  getAllUsers: async (): Promise<AdminUserDTO[]> => {
    const response = await axiosClient.get<AdminUserDTO[]>("/admin/users");
    return response.data;
  },

  // GET /api/admin/users/{userId} - Lấy user theo ID
  getUserById: async (userId: number): Promise<AdminUserDTO> => {
    const response = await axiosClient.get<AdminUserDTO>(`/admin/users/${userId}`);
    return response.data;
  },

  // POST /api/admin/users - Tạo user mới
  createUser: async (userData: AdminCreateUserDTO): Promise<AdminUserDTO> => {
    const response = await axiosClient.post<AdminUserDTO>("/admin/users", userData);
    return response.data;
  },

  // PUT /api/admin/users/{userId} - Cập nhật user
  updateUser: async (
    userId: number,
    userData: AdminUpdateUserDTO
  ): Promise<AdminUserDTO> => {
    const response = await axiosClient.put<AdminUserDTO>(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // PATCH /api/admin/users/{userId}/reset-password - Reset password
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

  // PATCH /api/admin/users/{userId}/status - Cập nhật status
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

  // DELETE /api/admin/users/{userId} - Xóa user (soft delete)
  deleteUser: async (userId: number): Promise<void> => {
    await axiosClient.delete(`/admin/users/${userId}`);
  },
};

export default adminAPI;



