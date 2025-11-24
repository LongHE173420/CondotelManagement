import axiosClient from "./axiosClient";

// =====================
// 🔹 DTOs (Interfaces)
// =====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  gender?: string;        // Added
  dateOfBirth?: string;   // Added
  address?: string;
}
export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordWithOtpRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Dành riêng cho Host đăng ký
export interface HostRegisterRequest {
  PhoneContact: string;
  Address?: string;
  CompanyName?: string;
  BankName: string;
  AccountNumber: string;
  AccountHolderName: string;
}

// =====================
// 🔹 User Model
// =====================
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

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

// =====================
// 🔹 Helper: Normalize User
// =====================
const normalizeUser = (data: any): UserProfile => {
  return {
    userId: data.UserId || data.userId || 0,
    fullName: data.FullName || data.fullName || "",
    email: data.Email || data.email || "",
    phone: data.Phone || data.phone,
    roleName: data.RoleName || data.roleName || "User",
    status: data.Status || data.status || "Active",
    gender: data.Gender || data.gender,
    dateOfBirth: data.DateOfBirth || data.dateOfBirth,
    address: data.Address || data.address,
    imageUrl: data.ImageUrl || data.imageUrl,
    createdAt: data.CreatedAt || data.createdAt,
  };
};

// =====================
// 🔹 API Definition
// =====================
export const authAPI = {
  /**
   * Đăng nhập bằng Email/Password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // SỬA: Đảm bảo gửi email/password (camelCase)
    const payload = {
      email: credentials.email,
      password: credentials.password,
    };
    const response = await axiosClient.post<{ token: string; user: any }>(
      "/Auth/login",
      payload
    );
    // ✅ Lưu token ngay sau khi thành công
    localStorage.setItem("token", response.data.token);
    return {
      token: response.data.token,
      user: normalizeUser(response.data.user),
    };
  },

  /**
   * Đăng nhập bằng Google
   */
  googleLogin: async (idToken: string): Promise<LoginResponse> => {
    // SỬA: Đảm bảo gửi payload là object { idToken: string } (camelCase)
    const payload = { idToken: idToken };
    const response = await axiosClient.post<{ token: string; user: any }>(
      "/Auth/google-login",
      payload
    );
    // ✅ Lưu token ngay sau khi thành công
    localStorage.setItem("token", response.data.token);

    return {
      token: response.data.token,
      user: normalizeUser(response.data.user),
    };
  },

  /**
   * Lấy thông tin cá nhân
   */
  getMe: async (): Promise<UserProfile> => {
    const response = await axiosClient.get<any>("/Profile/me");
    return normalizeUser(response.data);
  },

  /**
   * Đăng ký tài khoản (User)
   */
  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>(
      "/Auth/register",
      data
    );
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailRequest): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>(
      "/Auth/verify-email",
      data
    );
    return response.data;
  },
  /**
   * Đăng ký tài khoản Host
   */
  registerAsHost: async (
    data: HostRegisterRequest
  ): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>(
      "/Host/register-as-host",
      data
    );
    return response.data;
  },

  /**
   * Cập nhật thông tin cá nhân
   */
  updateProfile: async (data: Partial<UserProfile>): Promise<{ message: string }> => {
    const requestData: any = {
      FullName: data.fullName,
      Phone: data.phone,
      Gender: data.gender,
      DateOfBirth: data.dateOfBirth,
      Address: data.address,
      // imageUrl: data.imageUrl, // camelCase → đúng với backend mới (nếu backend dùng camelCase)
      // Nếu backend vẫn dùng ImageUrl (PascalCase) → dùng dòng dưới
      ImageUrl: data.imageUrl,
    };

    const response = await axiosClient.put<{ message: string }>("/Profile/me", requestData);
    return response.data;
  },

  /**
   * Đăng xuất
   */
  logout: async (): Promise<void> => {
    // Không cần gọi API Logout, chỉ cần xóa token
    // await axiosClient.post("/Auth/logout");
  },

  /**
   * Gửi OTP quên mật khẩu
   */
  sendOTP: async (
    request: ForgotPasswordRequest
  ): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>(
      "/Auth/send-otp",
      request
    );
    return response.data;
  },

  /**
   * Reset mật khẩu bằng OTP
   */
  resetPasswordWithOTP: async (
    request: ResetPasswordWithOtpRequest
  ): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>(
      "/Auth/reset-password-with-otp",
      request
    );
    return response.data;
  },

  /**
   * Đổi mật khẩu
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await axiosClient.post<{ message: string }>(
      "/Auth/change-password",
      data
    );
    return response.data;
  },

  /**
   * Kiểm tra quyền Admin
   */
  adminCheck: async (): Promise<{ message: string }> => {
    const response = await axiosClient.get<{ message: string }>(
      "/Auth/admin-check"
    );
    return response.data;
  },
};

// =====================
// 🔹 Export default
// =====================
export default authAPI;