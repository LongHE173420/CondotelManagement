import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminAPI, AdminUserDTO, AdminUpdateUserDTO, AdminUserResponse } from "api/admin";

// === 1. ĐỊNH NGHĨA LOẠI VAI TRÒ & TRẠNG THÁI ===
type UserRole = "Owner" | "Tenant" | "Admin" | "Marketer" | "";
type UserStatus = "Active" | "Inactive" | "Pending";

// === 2. HÀM CHUYỂN ĐỔI GIỮA FE & BE ===
const roleNameToId = (roleName?: string): number | undefined => {
  switch (roleName) {
    case "Admin": return 1;
    case "Owner": return 2;        // BE: Host
    case "Tenant": return 3;       // BE: User
    case "Marketer": return 4;     // BE: ContentManager
    default: return undefined;
  }
};

const roleIdToName = (roleNameBE?: string): UserRole => {
  switch (roleNameBE) {
    case "Host": return "Owner";
    case "User": return "Tenant";
    case "ContentManager": return "Marketer";
    case "Admin": return "Admin";
    default: return "";
  }
};

// === 3. COMPONENT FORM INPUT ===
interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500
                 disabled:bg-gray-100 disabled:text-gray-500`}
    />
  </div>
);

// === 4. COMPONENT FORM SELECT ===
interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onChange,
  children,
  disabled,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white
                 disabled:bg-gray-100 disabled:text-gray-500`}
    >
      {children}
    </select>
  </div>
);

// === 5. MAIN COMPONENT ===
const PageAccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<AdminUserDTO & { originalStatus?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // === LOAD USER DATA ===
  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy ID người dùng");
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const userId = parseInt(id, 10);
        if (isNaN(userId)) throw new Error("ID không hợp lệ");

        const userData = await adminAPI.getUserById(userId);

        setFormData({
          ...userData,
          roleName: roleIdToName(userData.roleName),
          originalStatus: userData.status,
        });
      } catch (err: any) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Không thể tải thông tin người dùng";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  // === HANDLE CHANGE ===
  const handleChange = (field: keyof AdminUserDTO, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // === HANDLE SUBMIT ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) throw new Error("ID không hợp lệ");

      // Validate required fields
      if (!formData.fullName?.trim() || !formData.email?.trim()) {
        throw new Error("Vui lòng điền đầy đủ Tên và Email");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error("Email không đúng định dạng");
      }

      // Build update data
      const updateData: AdminUpdateUserDTO = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      };

      if (formData.phone?.trim()) updateData.phone = formData.phone.trim();
      if (formData.gender?.trim()) updateData.gender = formData.gender.trim();
      if (formData.dateOfBirth?.trim()) updateData.dateOfBirth = formData.dateOfBirth.trim();
      if (formData.address?.trim()) updateData.address = formData.address.trim();

      // Handle Role (chỉ gửi roleId nếu không phải Admin)
      if (formData.roleName && formData.roleName !== "Admin") {
        const roleId = roleNameToId(formData.roleName as UserRole);
        if (!roleId) throw new Error("Vai trò không hợp lệ");
        updateData.roleId = roleId;
      }

      // Update Status (nếu thay đổi)
      if (formData.status && formData.status !== formData.originalStatus) {
        await adminAPI.updateUserStatus(userId, formData.status as UserStatus);
      }

      // Update User
      const response: AdminUserResponse = await adminAPI.updateUser(userId, updateData);

      setSuccess(response.message || "Cập nhật thành công!");
      setTimeout(() => navigate("/admin?tab=accounts"), 1500);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Không thể cập nhật thông tin";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin?tab=accounts");
  };

  const isAdmin = formData.roleName === "Admin";

  // === RENDER ===
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error && !formData.userId) {
    return (
      <div className="p-8 bg-red-100 text-red-800 rounded-lg max-w-2xl mx-auto">
        <p>{error}</p>
        <button
          onClick={() => navigate("/admin?tab=accounts")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Chi tiết tài khoản
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="User ID"
            value={formData.userId?.toString() || ""}
            onChange={() => { }}
            disabled
          />

          <FormInput
            label="Tên người dùng *"
            value={formData.fullName || ""}
            onChange={(val) => handleChange("fullName", val)}
            disabled={isAdmin}
          />

          <FormInput
            label="Email *"
            value={formData.email || ""}
            onChange={(val) => handleChange("email", val)}
            disabled={isAdmin}
          />

          <FormSelect
            label="Vai trò"
            value={formData.roleName || ""}
            onChange={(val) => handleChange("roleName", val)}
            disabled={isAdmin}
          >
            <option value="">-- Chọn vai trò --</option>
            <option value="Tenant">Khách hàng (User)</option>
            <option value="Owner">Chủ condotel (Host)</option>
            <option value="Marketer">Nhân viên tiếp thị</option>
            {isAdmin && <option value="Admin">Quản trị viên (Không thể thay đổi)</option>}
          </FormSelect>

          <FormInput
            label="Số điện thoại"
            value={formData.phone || ""}
            onChange={(val) => handleChange("phone", val)}
            disabled={isAdmin}
          />

          <FormSelect
            label="Giới tính"
            value={formData.gender || ""}
            onChange={(val) => handleChange("gender", val)}
            disabled={isAdmin}
          >
            <option value="">-- Chọn giới tính --</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </FormSelect>

          <FormInput
            label="Ngày sinh"
            type="date"
            value={formData.dateOfBirth || ""}
            onChange={(val) => handleChange("dateOfBirth", val)}
            disabled={isAdmin}
          />

          <FormInput
            label="Địa chỉ"
            value={formData.address || ""}
            onChange={(val) => handleChange("address", val)}
            disabled={isAdmin}
          />

          <FormSelect
            label="Trạng thái"
            value={formData.status || ""}
            onChange={(val) => handleChange("status", val)}
            disabled={isAdmin}
          >
            <option value="Active">Hoạt động</option>
            <option value="Inactive">Không hoạt động</option>
            <option value="Pending">Chờ kích hoạt</option>
          </FormSelect>

          {formData.createdAt && (
            <div className="text-sm text-gray-500">
              <p>Ngày tạo: {new Date(formData.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
          )}

          {/* Thông báo */}
          {success && (
            <div className="p-4 bg-green-100 text-green-800 rounded-lg text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || isAdmin}
              className={`px-6 py-2 rounded-md text-white font-medium transition ${isAdmin
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {saving ? "Đang lưu..." : isAdmin ? "Không thể sửa Admin" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageAccountDetail;