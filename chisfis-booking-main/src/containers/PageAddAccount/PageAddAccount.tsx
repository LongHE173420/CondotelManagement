import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI, AdminCreateUserDTO } from "api/admin";

type UserRole = "Owner" | "Tenant" | "Marketer" | "";

const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}> = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500
                 dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-300"
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
    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 
                 bg-white dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-300"
    >
      {children}
    </select>
  </div>
);

const roleNameToId = (roleName: UserRole): number | undefined => {
  if (roleName === "Tenant") return 3;
  if (roleName === "Owner") return 2;
  if (roleName === "Marketer") return 4;
  return undefined;
};

const PageAddAccount = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleName, setRoleName] = useState<UserRole>("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !password || !roleName) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc (Tên, Email, Mật khẩu, Vai trò).");
      return;
    }

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
      const roleId = roleNameToId(roleName);

      if (!roleId) {
        setError("Vai trò được chọn không hợp lệ.");
        setLoading(false);
        return;
      }

      const newAccountData: AdminCreateUserDTO = {
        email: email.trim(),
        password: password,
        fullName: fullName.trim(),
        roleId: roleId,
      };

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


      const response = await adminAPI.createUser(newAccountData);

      alert(response.message || "Thêm tài khoản mới thành công!");
      navigate("/admin?tab=accounts");

    } catch (err: any) {
      let errorMessage = "Không thể tạo tài khoản";

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
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin?tab=accounts");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/30 to-gray-50 dark:from-neutral-900 dark:via-slate-900/30 dark:to-neutral-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent mb-2 text-center">
            Thêm tài khoản mới
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-center">
            Tạo tài khoản người dùng mới cho hệ thống
          </p>
        </div>

        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput label="Tên người dùng *" value={fullName} onChange={setFullName} />
              <FormInput label="Email *" value={email} onChange={setEmail} type="email" />
              <FormInput label="Mật khẩu *" value={password} onChange={setPassword} type="password" />
              <FormInput label="Xác nhận mật khẩu *" value={confirmPassword} onChange={setConfirmPassword} type="password" />

              <FormSelect
                label="Vai trò *"
                value={roleName}
                onChange={setRoleName}
              >
                <option value="">-- Chọn vai trò --</option>
                <option value="Tenant">Khách Hàng (User)</option>
                <option value="Owner">Chủ Condotel (Host)</option>
                <option value="Marketer">Nhân viên (ContentManager/Marketer)</option>
              </FormSelect>

              <FormInput label="Số điện thoại" value={phone} onChange={setPhone} />
              <FormSelect label="Giới tính" value={gender} onChange={setGender}>
                <option value="">-- Chọn giới tính --</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </FormSelect>
              <FormInput label="Ngày sinh" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
            </div>

            <FormInput label="Địa chỉ" value={address} onChange={setAddress} />

            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="flex justify-end items-center gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-slate-100 hover:from-gray-200 hover:to-slate-200 text-gray-700 dark:text-gray-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </span>
                ) : "Lưu tài khoản"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PageAddAccount;
