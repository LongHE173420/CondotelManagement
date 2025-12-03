import React, { useState } from "react";
import axiosClient from "api/axiosClient";
import { useTranslation } from "i18n/LanguageContext";

interface Props {
  email: string;
  onSuccess: (token: string) => void;
}

// 👉 Định nghĩa kiểu dữ liệu trả về từ API
interface VerifyOtpResponse {
  token: string;
  message?: string;
}

const Step2_VerifyCode: React.FC<Props> = ({ email, onSuccess }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Mã OTP phải có 6 chữ số.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // ✅ Backend có thể không có endpoint verify-otp riêng
      // Có 2 trường hợp:
      // 1. Backend có endpoint verify-otp → gọi để verify trước
      // 2. Backend chỉ verify trong reset-password-with-otp → chuyển thẳng sang bước reset
      
      // Thử gọi verify-otp nếu có
      try {
        const res = await axiosClient.post<VerifyOtpResponse>("/Auth/verify-otp", {
          email,
          otp: code,
        });

        console.log("✅ Verify OTP response:", res.data);
        
        // Nếu backend trả về token, dùng token đó
        // Nếu không, dùng code (OTP) làm "token" để bước 3 sử dụng
        const token = res.data.token || code;
        
        // Chuyển sang bước reset password
        onSuccess(token || code);
      } catch (verifyErr: any) {
        // Nếu endpoint verify-otp không tồn tại (404 hoặc 405), 
        // hoặc backend không có endpoint này, chuyển thẳng sang bước reset
        // OTP sẽ được verify ở bước 3 khi reset password
        if (verifyErr.response?.status === 404 || verifyErr.response?.status === 405) {
          console.log("ℹ️ Verify OTP endpoint not found, will verify in reset step");
          console.log("ℹ️ Proceeding to reset password step with OTP:", code);
          // Chuyển sang bước reset password, OTP sẽ được verify ở bước 3
          onSuccess(code);
        } else {
          // Nếu là lỗi khác (như OTP sai, 400), throw lỗi để hiển thị thông báo
          console.error("❌ Verify OTP error:", verifyErr.response?.status, verifyErr.response?.data);
          throw verifyErr;
        }
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      let errorMessage = "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.";
      
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
      <h2 className="text-2xl font-bold text-center">{t.auth.forgotPassword.verifyCode}</h2>
      <p className="text-sm text-center text-gray-600">
        {t.auth.forgotPassword.codeInstructions} <b>{email}</b>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={6}
            className="w-full px-3 py-2 mt-1 text-2xl tracking-[1em] text-center border border-gray-300 rounded-md"
            placeholder="123456"
          />
        </div>

        {error && <p className="text-sm text-center text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? t.auth.forgotPassword.verifying : t.auth.forgotPassword.confirm}
        </button>
      </form>
    </div>
  );
};

export default Step2_VerifyCode;
