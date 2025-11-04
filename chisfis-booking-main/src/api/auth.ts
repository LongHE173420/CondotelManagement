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

  // GET /api/Auth/me
  getMe: async (): Promise<UserProfile> => {
    const response = await axiosClient.get<UserProfile>("/Auth/me");
    return response.data;
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
};

export default authAPI;
