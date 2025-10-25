import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Định nghĩa kiểu dữ liệu (Copy từ các file trước) ---
type UserRole = "Chủ Condotel" | "Khách Hàng" | "";
type UserStatus = "Hoạt động" | "Không hoạt động";

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


// --- Component Trang Thêm Tài khoản ---
const PageAddAccount = () => {
  const navigate = useNavigate();

  // State cho tất cả các trường
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(""); // Mặc định là rỗng
  const [status, setStatus] = useState<UserStatus>("Hoạt động"); // Mặc định Hoạt động

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Xóa lỗi cũ

    // --- Validation (Kiểm tra) cơ bản ---
    if (!username || !fullName || !email || !password || !role) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }
    // --- Hết Validation ---

    setLoading(true);
    const newAccountData = { username, fullName, email, password, role, status };
    
    // TODO: Thay thế bằng API thật
    // POST /api/users/ { ...newAccountData }
    console.log("Saving new account:", newAccountData);
    
    setTimeout(() => {
      setLoading(false);
      alert("Thêm tài khoản mới thành công!");
      navigate("/account-list"); // Quay lại trang danh sách
    }, 1000);
  };

  const handleCancel = () => {
    navigate("/account-list"); // Quay lại trang danh sách
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
          Thêm tài khoản mới
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Tên đăng nhập"
            value={username}
            onChange={setUsername}
          />
          <FormInput
            label="Tên người dùng"
            value={fullName}
            onChange={setFullName}
          />
          <FormInput
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
          />
          <FormInput
            label="Mật khẩu"
            value={password}
            onChange={setPassword}
            type="password"
          />
          <FormInput
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={setConfirmPassword}
            type="password"
          />

          <FormSelect
            label="Vai trò"
            value={role}
            onChange={setRole}
          >
            <option value="">-- Chọn vai trò --</option>
            <option value="Khách Hàng">Khách Hàng</option>
            <option value="Chủ Condotel">Chủ Condotel</option>
          </FormSelect>

          <FormSelect
            label="Trạng thái"
            value={status}
            onChange={setStatus}
          >
            <option value="Hoạt động">Hoạt động</option>
            <option value="Không hoạt động">Không hoạt động</option>
          </FormSelect>
          
          {/* Hiển thị lỗi nếu có */}
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
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