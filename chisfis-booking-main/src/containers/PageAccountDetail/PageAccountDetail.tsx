import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminAPI, AdminUserDTO, AdminUpdateUserDTO, AdminUserResponse } from "api/admin";

type UserRole = "Owner" | "Tenant" | "Admin" | "Marketer" | "";
type UserStatus = "Active" | "Inactive" | "Pending";

const roleNameToId = (roleName?: string): number | undefined => {
  switch (roleName) {
    case "Admin": return 1;
    case "Owner": return 2;
    case "Tenant": return 3;
    case "Marketer": return 4;
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
    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                 disabled:bg-neutral-100 dark:disabled:bg-neutral-700 disabled:text-neutral-500
                 dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-300`}
    />
  </div>
);

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
    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 
                 bg-white dark:bg-neutral-700 dark:text-neutral-100
                 disabled:bg-neutral-100 dark:disabled:bg-neutral-700 disabled:text-neutral-500 transition-all duration-300`}
    >
      {children}
    </select>
  </div>
);

const PageAccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<AdminUserDTO & { originalStatus?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleChange = (field: keyof AdminUserDTO, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) throw new Error("ID không hợp lệ");

      if (!formData.fullName?.trim() || !formData.email?.trim()) {
        throw new Error("Vui lòng điền đầy đủ Tên và Email");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error("Email không đúng định dạng");
      }

      const updateData: AdminUpdateUserDTO = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      };

      if (formData.phone?.trim()) updateData.phone = formData.phone.trim();
      if (formData.gender?.trim()) updateData.gender = formData.gender.trim();
      if (formData.dateOfBirth?.trim()) updateData.dateOfBirth = formData.dateOfBirth.trim();
      if (formData.address?.trim()) updateData.address = formData.address.trim();

      if (formData.roleName && formData.roleName !== "Admin") {
        const roleId = roleNameToId(formData.roleName as UserRole);
        if (!roleId) throw new Error("Vai trò không hợp lệ");
        updateData.roleId = roleId;
      }

      if (formData.status && formData.status !== formData.originalStatus) {
        await adminAPI.updateUserStatus(userId, formData.status as UserStatus);
      }

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-slate-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error && !formData.userId) {
    return (
      <div className="p-8 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl max-w-2xl mx-auto shadow-xl">
        <p className="mb-4">{error}</p>
        <button
          onClick={() => navigate("/admin?tab=accounts")}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/30 to-gray-50 dark:from-neutral-900 dark:via-slate-900/30 dark:to-neutral-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent mb-2">
            Chi tiết tài khoản
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Xem và chỉnh sửa thông tin tài khoản người dùng
          </p>
        </div>

        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                disabled={true}
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
            </div>

            <FormInput
              label="Địa chỉ"
              value={formData.address || ""}
              onChange={(val) => handleChange("address", val)}
              disabled={isAdmin}
            />

            {formData.createdAt && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Ngày tạo: {new Date(formData.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 text-green-800 dark:text-green-200 rounded-xl">
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-slate-100 hover:from-gray-200 hover:to-slate-200 text-gray-700 dark:text-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || isAdmin}
                className={`px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 ${isAdmin
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white"
                  }`}
              >
                {saving ? "Đang lưu..." : isAdmin ? "Không thể sửa Admin" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PageAccountDetail;
