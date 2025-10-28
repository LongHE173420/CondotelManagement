import React, { useState } from "react";
import axiosClient from "api/axiosClient";

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
      // ✅ chỉ định type cho response ở đây
      const res = await axiosClient.post<VerifyOtpResponse>("/auth/verify-otp", {
        email,
        otp: code,
      });

      const token = res.data.token;
      if (!token) {
        setError("Không nhận được token xác thực từ máy chủ.");
        return;
      }

      onSuccess(token);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center">Verify Code</h2>
      <p className="text-sm text-center text-gray-600">
        We've sent a 6-digit code to <b>{email}</b>.
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
          {loading ? "Verifying..." : "Confirm"}
        </button>
      </form>
    </div>
  );
};

export default Step2_VerifyCode;
