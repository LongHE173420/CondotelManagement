import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// --- Định nghĩa kiểu dữ liệu (Copy từ PageAccountList) ---
type UserRole = "Chủ Condotel" | "Khách Hàng";
type UserStatus = "Hoạt động" | "Không hoạt động";

interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Dữ liệu mẫu (Giả lập fetch từ API) ---
const mockUserDetail: UserAccount = {
  id: "1",
  username: "an.nguyen",
  fullName: "Nguyễn Văn An",
  email: "An@gmail.com",
  role: "Khách Hàng", // Dựa theo ảnh của bạn
  status: "Hoạt động", // Dựa theo ảnh của bạn
  createdAt: "10/10/2025",
  updatedAt: "12/10/2025",
};

// --- Component Form Input ---
interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                 disabled:bg-gray-100 disabled:text-gray-500"
    />
  </div>
);

// --- Component Form Select ---
interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: any) => void;
  children: React.ReactNode;
}

const FormSelect: React.FC<FormSelectProps> = ({ label, value, onChange, children }) => (
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


// --- Component Trang Chi tiết Tài khoản ---
const PageAccountDetail = () => {
  // Giả lập lấy ID từ URL, ví dụ: /account-detail/an.nguyen
  const { id } = useParams();
  const navigate = useNavigate();

  // State để lưu trữ dữ liệu form
  const [formData, setFormData] = useState<Partial<UserAccount>>({});
  const [loading, setLoading] = useState(true);

  // Giả lập fetch data khi component mount
  useEffect(() => {
    // TODO: Thay thế bằng API thật
    // fetch(`/api/users/${id}`)
    console.log("Fetching data for user:", id);
    setLoading(true);
    setTimeout(() => {
      setFormData(mockUserDetail);
      setLoading(false);
    }, 500);
  }, [id]);

  // Hàm cập nhật state khi gõ
  const handleChange = (field: keyof UserAccount, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Gọi API để lưu
    // PUT /api/users/${id} { ...formData }
    console.log("Saving data:", formData);
    setTimeout(() => {
      setLoading(false);
      alert("Lưu thành công!");
      navigate("/account-list"); // Quay lại trang danh sách
    }, 1000);
  };

  const handleCancel = () => {
    navigate("/account-list"); // Quay lại trang danh sách
  };

  if (loading && !formData.id) {
    return <div className="p-8">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Chi tiết tài khoản
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Tên đăng nhập"
            value={formData.username || ""}
            onChange={(val) => handleChange("username", val)}
            disabled // Thường không cho đổi Tên đăng nhập
          />

          <FormInput
            label="Tên người dùng"
            value={formData.fullName || ""}
            onChange={(val) => handleChange("fullName", val)}
          />

          <FormInput
            label="Email"
            value={formData.email || ""}
            onChange={(val) => handleChange("email", val)}
          />

          <FormSelect
            label="Vai trò"
            value={formData.role || ""}
            onChange={(val) => handleChange("role", val)}
          >
            <option value="Khách Hàng">Khách Hàng</option>
            <option value="Chủ Condotel">Chủ Condotel</option>
          </FormSelect>

          <FormSelect
            label="Trạng thái"
            value={formData.status || ""}
            onChange={(val) => handleChange("status", val)}
          >
            <option value="Hoạt động">Hoạt động</option>
            <option value="Không hoạt động">Không hoạt động</option>
          </FormSelect>

          {/* --- Thông tin ngày tháng (chỉ hiển thị) --- */}
          <div className="text-sm text-gray-500 space-y-2">
            <p>Ngày tạo: {formData.createdAt}</p>
            <p>Ngày cập nhật cuối: {formData.updatedAt}</p>
          </div>

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
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageAccountDetail;