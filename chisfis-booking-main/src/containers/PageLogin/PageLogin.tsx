import React, { FC, useState } from "react";
import { Helmet } from "react-helmet";
import Input from "shared/Input/Input";
import { Link, useNavigate } from "react-router-dom";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { useAuth } from "contexts/AuthContext";
import { authAPI, LoginResponse } from "api/auth";
import { useTranslation } from "i18n/LanguageContext";

// Import thư viện Google
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

export interface PageLoginProps {
  className?: string;
}

const PageLogin: FC<PageLoginProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { login } = useAuth(); // Hàm login từ AuthContext
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // Hàm xử lý đăng nhập Email/Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // FE gửi { email, password } (camelCase)
      const response = await authAPI.login({ email, password });
      handleLoginSuccess(response); // Gọi hàm xử lý chung
    } catch (error: any) {
      handleLoginError(error); // Gọi hàm xử lý chung
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý Google login
  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setError("");
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("Không lấy được thông tin đăng nhập từ Google.");
      return;
    }

    setLoading(true);
    try {
      // Gọi API, token được lưu trong authAPI.googleLogin
      const response = await authAPI.googleLogin(idToken);

      // DÒNG NÀY ĐÃ BỊ XÓA VÌ ĐÃ CHUYỂN VÀO auth.ts:
      // localStorage.setItem("token", response.token); 

      handleLoginSuccess(response);
    } catch (err: any) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };
  // Xử lý login thành công
  const handleLoginSuccess = (response: LoginResponse) => {
    if (response.token && response.user) {
      // Call login with token and user data
      login(response.token, response.user);

      // 2. Điều hướng theo role
      const role = response.user.roleName;
      if (role === "Admin" || role === "ContentManager") {
        navigate("/admin");
      } else if (role === "Host") {
        navigate("/host-dashboard");
      } else {
        navigate("/");
      }
    } else {
      setError("Không nhận được dữ liệu token hoặc user từ server.");
    }
  };

  // Xử lý login thất bại
  const handleLoginError = (error: any) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        setError("Email/mật khẩu không đúng, hoặc tài khoản Google không hợp lệ!");
      } else if (status === 400) {
        // Lỗi 400 Bad Request (có thể do lỗi dữ liệu hoặc BCrypt)
        // Nếu là lỗi BCrypt, Backend trả về 500. 
        // Nếu là lỗi validation, Backend trả về 400.
        setError(error.response.data?.message || "Dữ liệu không hợp lệ!");
      } else if (status === 500) {
        setError("Lỗi máy chủ nội bộ. Vui lòng kiểm tra console hoặc database.");
      } else {
        setError(error.response.data?.message || "Đã xảy ra lỗi!");
      }
    } else {
      setError("Không thể kết nối đến server! Vui lòng kiểm tra backend.");
    }
  };


  return (
    <div className={`nc-PageLogin ${className}`} data-nc-id="PageLogin">
      <Helmet>
        <title>{t.auth.login.title} || Fiscondotel</title>
      </Helmet>

      <div className="container mb-24 lg:mb-32">
        <h2 className="my-20 flex items-center text-3xl md:text-5xl font-semibold justify-center">
          {t.auth.login.title}
        </h2>

        <div className="max-w-md mx-auto space-y-6">
          {/* Social Login */}
          <div className="grid gap-3">
            {/* NÚT GOOGLE LOGIN THẬT */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
                }}
                shape="rectangular"
                theme="outline"
                size="large"
                width="368px" // Chỉnh độ rộng cho khớp form
              />
            </div>
          </div>

          {/* OR */}
          <div className="relative text-center">
            <span className="block w-full border-b border-neutral-100 dark:border-neutral-600"></span>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 px-7">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {t.auth.login.or}
              </span>
            </div>
          </div>

          {/* FORM ĐĂNG NHẬP THƯỜNG */}
          <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                {t.auth.login.emailAddress}
              </span>
              <Input
                type="email"
                placeholder="example@example.com"
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                {t.auth.login.password}
                <Link to="/forgot-pass" className="text-sm">
                  {t.auth.login.forgotPassword}
                </Link>
              </span>
              <Input
                type="password"
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {/* Hiển thị lỗi */}
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            <ButtonPrimary type="submit" disabled={loading}>
              {/* Hiển thị loading trên cả 2 nút */}
              {loading ? t.auth.login.processing : t.auth.login.loginButton}
            </ButtonPrimary>
          </form>

          {/* Link to Signup */}
          <span className="block text-center text-neutral-700 dark:text-neutral-300">
            {t.auth.login.noAccount} <Link to="/signup">{t.auth.login.createAccount}</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageLogin; 