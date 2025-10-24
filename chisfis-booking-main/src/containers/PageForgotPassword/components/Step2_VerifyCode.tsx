import React, { useState } from "react";

// Props: Cần email (để gửi API) và hàm onSuccess
interface Props {
  email: string;
  onSuccess: (token: string) => void;
}

const Step2_VerifyCode: React.FC<Props> = ({ email, onSuccess }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Mã code phải có 6 chữ số.");
      return;
    }
    setError("");
    setLoading(true);

    // --- GIẢ LẬP GỌI API ---
    // TODO: Thay thế bằng lệnh gọi API thật
    // POST /api/auth/verify-code { email, code }
    console.log(`Xác thực code ${code} cho email ${email}`);
    setTimeout(() => {
      setLoading(false);
      
      // Giả lập code sai
      if (code === "000000") {
        setError("Mã code không đúng hoặc đã hết hạn.");
        return;
      }

      // Giả lập thành công, trả về 1 token tạm
      const fakeVerificationToken = "jwt-token-tam-thoi-de-doi-mat-khau";
      onSuccess(fakeVerificationToken);

    }, 1500);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center">Verify Code</h2>
      <p className="text-sm text-center text-gray-600">
        We've sent a 6-digit code to {email}.
      </p>
      
      {/* Ghi chú: Giao diện 6 ô riêng lẻ phức tạp hơn.
        Để đơn giản, tôi dùng 1 ô input cho phép nhập 6 số.
        Bạn có thể thay thế bằng thư viện "react-otp-input" sau.
      */}
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