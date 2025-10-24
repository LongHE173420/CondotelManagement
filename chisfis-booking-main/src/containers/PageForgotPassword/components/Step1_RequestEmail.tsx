import React, { useState } from "react";

// Định nghĩa props: Cần một hàm onSuccess để báo cho cha biết đã xong
interface Props {
  onSuccess: (email: string) => void;
}

const Step1_RequestEmail: React.FC<Props> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập email của bạn.");
      return;
    }
    setError("");
    setLoading(true);

    // --- GIẢ LẬP GỌI API ---
    // TODO: Thay thế bằng lệnh gọi API (fetch/axios) thật
    // POST /api/auth/forgot-password { email }
    console.log("Gửi yêu cầu reset cho:", email);
    setTimeout(() => {
      setLoading(false);
      // Giả lập thành công, gọi hàm onSuccess
      onSuccess(email);
    }, 1500); // Giả lập 1.5 giây chờ
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
      <p className="text-sm text-gray-600">
        Please enter the email address you use on Condotel. We'll send you a code
        to reset your password.
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
          {loading ? "Sending..." : "Reset Password"}
        </button>
      </form>
      <div className="text-sm text-center">
        Come back{" "}
        <a href="/login" className="font-medium text-blue-600 hover:underline">
          Login
        </a>
      </div>
    </div>
  );
};

export default Step1_RequestEmail;