import React, { useState } from "react";
import axiosClient from "api/axiosClient";
import { useTranslation } from "i18n/LanguageContext";

interface Props {
  email: string;
  token: string; // ở đây bạn có thể không cần token, chỉ cần otp nếu backend chỉ check otp
  onSuccess: () => void;
}

const Step3_ResetPassword: React.FC<Props> = ({ email, token, onSuccess }) => {
  const { t } = useTranslation();
  // token đã là OTP từ Step2, không cần nhập lại
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Không tìm thấy mã OTP. Vui lòng thử lại từ đầu.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      await axiosClient.post("/Auth/reset-password-with-otp", {
        email,
        otp: token, // Dùng token/OTP đã verify ở Step2
        newPassword,
      });

      alert("Đổi mật khẩu thành công! Quay lại đăng nhập.");
      onSuccess();
    } catch (err: any) {
      let errorMessage = "Không thể đổi mật khẩu. Vui lòng thử lại.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center">{t.auth.forgotPassword.resetPassword}</h2>
      <p className="text-sm text-center text-gray-600">
        {t.auth.forgotPassword.resetInstructions} <b>{email}</b>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t.auth.forgotPassword.newPassword}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t.auth.forgotPassword.newPasswordPlaceholder}
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t.auth.forgotPassword.confirmNewPassword}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t.auth.forgotPassword.confirmPasswordPlaceholder}
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? t.auth.forgotPassword.updating : t.auth.forgotPassword.resetButton}
        </button>
      </form>
    </div>
  );
};

export default Step3_ResetPassword;
