import React, { useState } from "react";

// Props: Cần email, token (để gửi API) và hàm onSuccess
interface Props {
  email: string;
  token: string;
  onSuccess: () => void;
}

const Step3_ResetPassword: React.FC<Props> = ({ email, token, onSuccess }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    // --- GIẢ LẬP GỌI API ---
    // TODO: Thay thế bằng lệnh gọi API thật
    // POST /api/auth/reset-password { email, token, newPassword }
    console.log(`Đổi mật khẩu cho ${email} với token ${token}`);
    setTimeout(() => {
      setLoading(false);
      // Giả lập thành công
      alert("Đổi mật khẩu thành công! Bạn sẽ được chuyển về trang đăng nhập.");
      onSuccess();
    }, 1500);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center">New Password</h2>
      <p className="text-sm text-gray-600">
        Hãy tạo mật khẩu mới cho tài khoản của bạn.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
        
        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default Step3_ResetPassword;