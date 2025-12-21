import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminAPI, AdminUserDTO, AdminUpdateUserDTO } from "api/admin";

const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}> = ({ label, value, onChange, disabled = false, type = "text" }) => (
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

const FormSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ label, value, onChange, children, disabled = false }) => (
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

// Mapping đúng 3 role
const backendRoleToDisplay = (roleName: string | undefined): string => {
  switch (roleName) {
    case "Admin": return "Admin";
    case "Host": return "Chủ Condotel";
    case "Tenant": return "Khách Hàng";
    default: return "Khách Hàng";
  }
};

const displayRoleToRoleId = (displayRole: string): number => {
  switch (displayRole) {
    case "Admin": return 1;
    case "Chủ Condotel": return 4;  // Host
    case "Khách Hàng": return 3;    // Tenant
    default: return 3;
  }
};

const PageAccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<AdminUserDTO & {
    displayRole?: string;
    originalDisplayRole?: string;
    originalStatus?: string;
  }>>({});

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
      try {
        const userId = parseInt(id, 10);
        const userData = await adminAPI.getUserById(userId);

        const displayRole = backendRoleToDisplay(userData.roleName);

        setFormData({
          ...userData,
          displayRole,
          originalDisplayRole: displayRole,
          originalStatus: userData.status,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const userId = parseInt(id, 10);

      const updateData: AdminUpdateUserDTO = {
        fullName: formData.fullName?.trim() || "",
        email: formData.email?.trim() || "",
        phone: formData.phone?.trim(),
        gender: formData.gender?.trim(),
        dateOfBirth: formData.dateOfBirth?.trim(),
        address: formData.address?.trim(),
      };

      // === BẮT BUỘC GỬI ROLEID NẾU KHÔNG PHẢI ADMIN ===
      if (!isAdmin) {
        if (!formData.displayRole || formData.displayRole === "") {
          setError("Vui lòng chọn vai trò cho người dùng");
          setSaving(false);
          return;
        }
        updateData.roleId = displayRoleToRoleId(formData.displayRole);
      }
      // Nếu là Admin → không gửi roleId để tránh bị thay đổi

      // Cập nhật status nếu có thay đổi
      if (formData.status && formData.status !== formData.originalStatus) {
        await adminAPI.updateUserStatus(userId, formData.status as "Active" | "Inactive" | "Pending");
      }

      await adminAPI.updateUser(userId, updateData);

      setSuccess("Cập nhật thành công!");
      setTimeout(() => navigate("/admin?tab=accounts"), 1500);
    } catch (err: any) {
      setSaving(false);

      if (err.response?.status === 400) {
        const errors = err.response.data?.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          setError(errors.join("\n")); // Hiển thị lỗi chi tiết
        } else {
          setError(err.response.data?.message || "Dữ liệu không hợp lệ");
        }
      } else {
        setError(err.message || "Có lỗi xảy ra khi cập nhật");
      }
    }
  };

  const isAdmin = formData.displayRole === "Admin";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/30 to-gray-50 dark:from-neutral-900 dark:via-slate-900/30 dark:to-neutral-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent mb-2">
            Chi tiết tài khoản
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">Xem và chỉnh sửa thông tin tài khoản người dùng</p>
        </div>

        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50">
          {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl">{error}</div>}
          {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-xl">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput label="User ID" value={formData.userId?.toString() || ""} onChange={() => { }} disabled />
              <FormInput label="Tên người dùng *" value={formData.fullName || ""} onChange={val => handleChange("fullName", val)} disabled={isAdmin} />
              <FormInput label="Email *" value={formData.email || ""} onChange={val => handleChange("email", val)} disabled={true} />

              <FormSelect label="Vai trò" value={formData.displayRole || ""} onChange={val => handleChange("displayRole", val)} disabled={isAdmin}>
                <option value="">-- Chọn vai trò --</option>
                <option value="Khách Hàng">Khách Hàng</option>
                <option value="Chủ Condotel">Chủ Condotel</option>
              </FormSelect>

              <FormInput label="Số điện thoại" value={formData.phone || ""} onChange={val => handleChange("phone", val)} disabled={isAdmin} />
              <FormSelect label="Giới tính" value={formData.gender || ""} onChange={val => handleChange("gender", val)} disabled={isAdmin}>
                <option value="">-- Chọn giới tính --</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </FormSelect>

              <FormInput label="Ngày sinh" type="date" value={formData.dateOfBirth || ""} onChange={val => handleChange("dateOfBirth", val)} disabled={isAdmin} />
              <FormSelect label="Trạng thái" value={formData.status || ""} onChange={val => handleChange("status", val)} disabled={isAdmin}>
                <option value="Active">Hoạt động</option>
                <option value="Inactive">Không hoạt động</option>
                <option value="Pending">Chờ kích hoạt</option>
              </FormSelect>
            </div>

            <FormInput label="Địa chỉ" value={formData.address || ""} onChange={val => handleChange("address", val)} disabled={isAdmin} />

            {formData.createdAt && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border">
                <p className="text-sm font-medium text-blue-600">
                  Ngày tạo: {new Date(formData.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={() => navigate("/admin?tab=accounts")} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold">
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || isAdmin}
                className={`px-6 py-3 rounded-xl font-bold ${isAdmin ? "bg-gray-400 text-white cursor-not-allowed" : "bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white"}`}
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