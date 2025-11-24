import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI, AdminCreateUserDTO, AdminUserResponse } from "api/admin"; // Import thêm AdminUserResponse


type UserRole = "Owner" | "Tenant" | "Marketer" | "";
type UserStatus = "Active" | "Inactive";

// --- Dùng lại các component Form (Bạn có thể chuyển ra file shared) ---
const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}> = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const FormSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: any) => void;
  children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
    >
      {children}
    </select>
  </div>
);
// --- Hết phần component dùng lại ---

// SỬA 2: Thêm hàm helper để map tên (FE) sang ID (BE)
// ⚠️ QUAN TRỌNG: Đảm bảo các ID này (1, 2, 3, 4) khớp với bảng [Role] trong DB của bạn
const roleNameToId = (roleName: UserRole): number | undefined => {
  // Giả sử 'Tenant' (FE) là 'User' (BE)
  if (roleName === "Tenant") return 3;
  // Giả sử 'Owner' (FE) là 'Host' (BE)
  if (roleName === "Owner") return 2;
  // Giả sử 'Marketer' (FE) là 'ContentManager' (BE)
  if (roleName === "Marketer") return 4;
  // Không có 'Admin' (RoleID = 1) vì Admin không được tạo Admin
  return undefined;
};


// --- Component Trang Thêm Tài khoản ---
const PageAddAccount = () => {
  const navigate = useNavigate();

  // State cho tất cả các trường
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleName, setRoleName] = useState<UserRole>(""); // Mặc định là rỗng
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Xóa lỗi cũ

    // --- Validation (Kiểm tra) cơ bản ---
    if (!fullName || !email || !password || !roleName) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc (Tên, Email, Mật khẩu, Vai trò).");
      return;
    }

    // ... (Validation Email, Password, ConfirmPassword giữ nguyên) ...
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // --- SỬA 3: Logic tạo DTO ---

      // 1. Chuyển đổi RoleName (string) sang RoleId (number)
      const roleId = roleNameToId(roleName);

      // 2. Kiểm tra RoleId (thay vì roleName)
      if (!roleId) {
        setError("Vai trò được chọn không hợp lệ.");
        setLoading(false);
        return;
      }

      // 3. Tạo DTO chuẩn với roleId
      const newAccountData: AdminCreateUserDTO = {
        email: email.trim(),
        password: password,
        fullName: fullName.trim(),
        roleId: roleId, // Gửi đi ID (number)
      };

      // Thêm các trường optional nếu có giá trị
      if (phone && phone.trim()) {
        newAccountData.phone = phone.trim();
      }
      if (gender && gender.trim()) {
        newAccountData.gender = gender.trim();
      }
      if (dateOfBirth && dateOfBirth.trim()) {
        newAccountData.dateOfBirth = dateOfBirth.trim();
      }
      if (address && address.trim()) {
        newAccountData.address = address.trim();
      }

      console.log("Saving new account:", newAccountData);

      // API của bạn giờ trả về: { message: string, user: AdminUserDTO }
      const response = await adminAPI.createUser(newAccountData);

      // SỬA 4: Lấy thông báo ("...đã gửi OTP") từ response
      alert(response.message || "Thêm tài khoản mới thành công!");
      navigate("/admin?tab=accounts"); // Quay lại trang admin accounts

    } catch (err: any) {
      console.error("Failed to create user:", err);
      let errorMessage = "Không thể tạo tài khoản";

      if (err.response?.data?.message) {
        // Lỗi này có thể là "Email đã tồn tại" hoặc "Không có quyền tạo Admin"
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Handle validation errors (nếu có)
        const errors = err.response.data.errors;
        const errorList = Object.entries(errors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
            const messageList = Array.isArray(messages) ? messages.join(", ") : messages;
            return `${fieldName}: ${messageList}`;
          })
          .join("\n");
        errorMessage = `Lỗi validation:\n${errorList}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin?tab=accounts"); // Quay lại trang admin accounts
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
          Thêm tài khoản mới
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (Các FormInput: FullName, Email, Password, ConfirmPassword giữ nguyên) ... */}
          <FormInput label="Tên người dùng *" value={fullName} onChange={setFullName} />
          <FormInput label="Email *" value={email} onChange={setEmail} type="email" />
          <FormInput label="Mật khẩu *" value={password} onChange={setPassword} type="password" />
          <FormInput label="Xác nhận mật khẩu *" value={confirmPassword} onChange={setConfirmPassword} type="password" />


          {/* SỬA 5: Cập nhật danh sách Role */}
          <FormSelect
            label="Vai trò *"
            value={roleName}
            onChange={setRoleName}
          >
            <option value="">-- Chọn vai trò --</option>
            {/* Đổi tên cho khớp với DB (User/Host) */}
            <option value="Tenant">Khách Hàng (User)</option>
            <option value="Owner">Chủ Condotel (Host)</option>
            {/* Thêm Role mới */}
            <option value="Marketer">Nhân viên (ContentManager/Marketer)</option>
            {/* Xóa Role Admin:
            <option value="Admin">Admin</option> 
            */}
          </FormSelect>

          {/* ... (Các FormInput/FormSelect còn lại giữ nguyên) ... */}
          <FormInput label="Số điện thoại" value={phone} onChange={setPhone} />
          <FormSelect label="Giới tính" value={gender} onChange={setGender}>
            <option value="">-- Chọn giới tính --</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </FormSelect>
          <FormInput label="Ngày sinh" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
          <FormInput label="Địa chỉ" value={address} onChange={setAddress} />


          {/* Hiển thị lỗi nếu có */}
          {error && (
            <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {/* --- Nút Bấm --- */}
          <div className="flex justify-end items-center gap-4 pt-4">
            <button
              type="button" // Nút Hủy không submit form
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
            >
              {loading ? "Đang lưu..." : "Lưu tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageAddAccount;