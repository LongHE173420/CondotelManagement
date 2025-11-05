import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminAPI, AdminUserDTO, AdminUpdateUserDTO } from "api/admin";

type UserRole = "Owner" | "Tenant" | "Admin";
type UserStatus = "Active" | "Inactive";


interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}

const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, disabled, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                 disabled:bg-gray-100 disabled:text-gray-500"
    />
  </div>
);


interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: any) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = ({ label, value, onChange, children, disabled }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white
                 disabled:bg-gray-100 disabled:text-gray-500"
    >
      {children}
    </select>
  </div>
);



const PageAccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<AdminUserDTO & { originalStatus?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy ID người dùng");
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      setLoading(true);
      setError("");
      
      try {
        const userId = parseInt(id, 10);
        if (isNaN(userId)) {
          throw new Error("ID không hợp lệ");
        }
        
        console.log("Fetching data for user:", userId);
        const userData = await adminAPI.getUserById(userId);
        console.log("User data loaded:", userData);
        
        // Store original status for comparison
        setFormData({
          ...userData,
          originalStatus: userData.status,
        });
      } catch (err: any) {
        console.error("Failed to load user:", err);
        let errorMessage = "Không thể tải thông tin người dùng";
        
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);


  const handleChange = (field: keyof AdminUserDTO, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      setError("Không tìm thấy ID người dùng");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        throw new Error("ID không hợp lệ");
      }

      // Validate required fields
      if (!formData.fullName || !formData.email) {
        setError("Vui lòng điền đầy đủ các trường bắt buộc (Tên, Email).");
        setSaving(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Email không đúng định dạng.");
        setSaving(false);
        return;
      }

      const updateData: AdminUpdateUserDTO = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      };

      // Add optional fields if they have values
      if (formData.phone && formData.phone.trim()) {
        updateData.phone = formData.phone.trim();
      }
      if (formData.roleName) {
        updateData.roleName = formData.roleName;
      }
      if (formData.gender && formData.gender.trim()) {
        updateData.gender = formData.gender.trim();
      }
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        updateData.dateOfBirth = formData.dateOfBirth.trim();
      }
      if (formData.address && formData.address.trim()) {
        updateData.address = formData.address.trim();
      }
      
      // Update status separately using updateUserStatus API
      if (formData.status && formData.status !== (formData as any).originalStatus) {
        try {
          await adminAPI.updateUserStatus(userId, formData.status);
        } catch (statusErr: any) {
          console.error("Failed to update status:", statusErr);
          throw new Error(`Không thể cập nhật trạng thái: ${statusErr.response?.data?.message || statusErr.message}`);
        }
      }

      console.log("Saving data:", updateData);
      await adminAPI.updateUser(userId, updateData);
      
      alert("Lưu thành công!");
      navigate("/admin?tab=accounts"); // Quay lại trang admin accounts
    } catch (err: any) {
      console.error("Failed to update user:", err);
      let errorMessage = "Không thể cập nhật thông tin người dùng";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
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
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin?tab=accounts"); // Quay lại trang admin accounts
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-4 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error && !formData.userId) {
    return (
      <div className="p-8 bg-red-100 text-red-800 rounded-lg">
        {error}
        <button
          onClick={() => navigate("/admin?tab=accounts")}
          className="ml-4 text-red-600 underline hover:text-red-800"
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
            onChange={() => {}}
            disabled
          />

          <FormInput
            label="Tên người dùng *"
            value={formData.fullName || ""}
            onChange={(val) => handleChange("fullName", val)}
          />

          <FormInput
            label="Email *"
            value={formData.email || ""}
            onChange={(val) => handleChange("email", val)}
          />

          <FormSelect
            label="Vai trò"
            value={formData.roleName || ""}
            onChange={(val) => handleChange("roleName", val)}
          >
            <option value="">-- Chọn vai trò --</option>
            <option value="Tenant">Khách Hàng (Tenant)</option>
            <option value="Owner">Chủ Condotel (Owner)</option>
            <option value="Admin">Admin</option>
          </FormSelect>

          <FormInput
            label="Số điện thoại"
            value={formData.phone || ""}
            onChange={(val) => handleChange("phone", val)}
          />

          <FormSelect
            label="Giới tính"
            value={formData.gender || ""}
            onChange={(val) => handleChange("gender", val)}
          >
            <option value="">-- Chọn giới tính --</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </FormSelect>

          <FormInput
            label="Ngày sinh"
            value={formData.dateOfBirth || ""}
            onChange={(val) => handleChange("dateOfBirth", val)}
            type="date"
          />

          <FormInput
            label="Địa chỉ"
            value={formData.address || ""}
            onChange={(val) => handleChange("address", val)}
          />

          <FormSelect
            label="Trạng thái"
            value={formData.status || ""}
            onChange={(val) => handleChange("status", val)}
          >
            <option value="Active">Hoạt động (Active)</option>
            <option value="Inactive">Không hoạt động (Inactive)</option>
          </FormSelect>

          {/* --- Thông tin ngày tháng (chỉ hiển thị) --- */}
          {formData.createdAt && (
            <div className="text-sm text-gray-500 space-y-2">
              <p>Ngày tạo: {new Date(formData.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
          )}

          {/* Error display */}
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
              disabled={saving}
              className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageAccountDetail;