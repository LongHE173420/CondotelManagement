import axiosClient from "./axiosClient";

// DTOs từ backend
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordWithOtpRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface LoginResponse {
  token: string;
  user?: UserProfile;
}

export interface UserProfile {
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

// API Calls
export const authAPI = {
  // POST /api/Auth/login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosClient.post<{
      token: string;
      roleName?: string;
      fullName?: string;
      userId?: number;
      email?: string;
      phone?: string;
      user?: UserProfile;
    }>("/Auth/login", credentials);
    
    const data = response.data;
    console.log("📦 Raw response:", data);
    
    // Backend trả về: { token, roleName, fullName } ở root level
    const loginResponse: LoginResponse = {
      token: data.token,
      user: data.user || {
        userId: data.userId || 0,
        fullName: data.fullName || "",
        email: credentials.email, // Use email from request
        phone: data.phone,
        roleName: data.roleName || "User",
        status: "Active",
      },
    };
    
    return loginResponse;
  },

  // POST /api/Auth/register
  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>("/Auth/register", data);
    return response.data;
  },

  // POST /api/Auth/logout
  logout: async (): Promise<void> => {
    await axiosClient.post("/Auth/logout");
  },

  // POST /api/Auth/send-otp
  sendOTP: async (request: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>("/Auth/send-otp", request);
    return response.data;
  },

  // POST /api/Auth/reset-password-with-otp
  resetPasswordWithOTP: async (
    request: ResetPasswordWithOtpRequest
  ): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>(
      "/Auth/reset-password-with-otp",
      request
    );
    return response.data;
  },

  // GET /api/Profile/me - Lấy thông tin user đang đăng nhập từ ProfileController
  getMe: async (): Promise<UserProfile> => {
    // Backend trả về từ ProfileController với field names có chữ I hoa (PascalCase)
    const response = await axiosClient.get<any>("/Profile/me");
    const data = response.data;
    
    // Normalize field names - backend trả về UserProfileDto với PascalCase
    const normalized: UserProfile = {
      userId: data.UserId || data.userId || 0,
      fullName: data.FullName || data.fullName || "",
      email: data.Email || data.email || "",
      phone: data.Phone || data.phone,
      roleName: data.RoleName || data.roleName || "",
      status: data.Status || data.status || "Active",
      gender: data.Gender || data.gender,
      dateOfBirth: data.DateOfBirth || data.dateOfBirth,
      address: data.Address || data.address,
      // Backend trả về ImageUrl (PascalCase)
      imageUrl: data.ImageUrl || data.imageUrl || data.avatarUrl || data.AvatarUrl || data.profileImage || data.ProfileImage || undefined,
      createdAt: data.CreatedAt || data.createdAt,
    };
    
    console.log("📦 Raw API response from /Profile/me:", data);
    console.log("✅ Normalized user profile:", normalized);
    console.log("🖼️ Avatar URL:", normalized.imageUrl);
    
    return normalized;
  },

  // GET /api/Auth/admin-check
  adminCheck: async (): Promise<{ message: string }> => {
    const response = await axiosClient.get<{ message: string }>("/Auth/admin-check");
    return response.data;
  },

  // POST /api/Auth/change-password - Đổi mật khẩu trong profile
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>("/Auth/change-password", data);
    return response.data;
  },

  // PUT /api/Profile/me - Cập nhật thông tin profile của user đang đăng nhập
  // DTO: UpdateProfileRequest (FullName required, Email/Phone/Gender/DateOfBirth/Address/ImageUrl optional)
  updateProfile: async (data: {
    fullName: string; // Required
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string; // Format: YYYY-MM-DD (sẽ được convert sang DateOnly ở backend)
    address?: string;
    imageUrl?: string; // URL của ảnh đại diện
  }): Promise<{ message: string }> => {
    // Map camelCase sang PascalCase để khớp với backend DTO
    const requestData: any = {
      FullName: data.fullName,
    };
    
    // Chỉ thêm các field có giá trị
    if (data.email) {
      requestData.Email = data.email;
    }
    if (data.phone) {
      requestData.Phone = data.phone;
    }
    if (data.gender) {
      requestData.Gender = data.gender;
    }
    if (data.dateOfBirth) {
      requestData.DateOfBirth = data.dateOfBirth; // Backend sẽ parse sang DateOnly
    }
    if (data.address) {
      requestData.Address = data.address;
    }
    // QUAN TRỌNG: ImageUrl phải được gửi nếu có giá trị (kể cả empty string)
    if (data.imageUrl !== undefined && data.imageUrl !== null) {
      requestData.ImageUrl = data.imageUrl.trim();
    }
    
    console.log("📤 updateProfile request data:", JSON.stringify(requestData, null, 2));
    console.log("🖼️ ImageUrl being sent:", requestData.ImageUrl);
    
    const response = await axiosClient.put<{ message: string }>("/Profile/me", requestData);
    
    console.log("✅ updateProfile response:", response.data);
    
    return response.data;
  },
};

export default authAPI;
