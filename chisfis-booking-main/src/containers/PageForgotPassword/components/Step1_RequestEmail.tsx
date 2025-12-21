import React, { useState } from "react";
import axiosClient from "api/axiosClient";
import { useTranslation } from "i18n/LanguageContext";

interface Props {
  onSuccess: (email: string) => void;
}

const Step1_RequestEmail: React.FC<Props> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập email của bạn.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Sử dụng authAPI để gửi OTP
      const res = await axiosClient.post("/Auth/send-otp", { email });

      // luôn trả về 200 → chỉ cần chuyển bước
      onSuccess(email);
    } catch (err) {
      setError("Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center">{t.auth.forgotPassword.title}</h2>
      <p className="text-sm text-gray-600">
        {t.auth.forgotPassword.emailInstructions}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
            placeholder="your-email@example.com"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? t.auth.forgotPassword.sending : t.auth.forgotPassword.sendButton}
        </button>
      </form>
    </div>
  );
};

export default Step1_RequestEmail;
