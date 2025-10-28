import Label from "components/Label/Label";
import React, { useState } from "react";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import Input from "shared/Input/Input";
import CommonLayout from "./CommonLayout";
import { authAPI } from "api/auth";

const AccountPass = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu mới và xác nhận không khớp!");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);

    try {
      // Gọi API đổi mật khẩu
      // Note: Backend cần có endpoint để đổi mật khẩu
      // await authAPI.changePassword({ ...formData });
      
      setMessage("Đổi mật khẩu thành công!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error("Change password error:", err);
      setError(err.response?.data?.message || "Không thể đổi mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CommonLayout>
        <div className="space-y-6 sm:space-y-8">
          {/* HEADING */}
          <h2 className="text-3xl font-semibold">Đổi mật khẩu</h2>
          <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

          <form className="max-w-xl space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label>Mật khẩu hiện tại</Label>
              <Input
                type="password"
                className="mt-1.5"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Mật khẩu mới</Label>
              <Input
                type="password"
                className="mt-1.5"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Xác nhận mật khẩu mới</Label>
              <Input
                type="password"
                className="mt-1.5"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            {message && (
              <div className="p-4 bg-green-100 text-green-800 rounded-lg text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="pt-2">
              <ButtonPrimary type="submit" disabled={loading}>
                {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </ButtonPrimary>
            </div>
          </form>
        </div>
      </CommonLayout>
    </div>
  );
};

export default AccountPass;
