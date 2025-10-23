import React, { FC, useState } from "react";
import facebookSvg from "images/Facebook.svg";
import twitterSvg from "images/Twitter.svg";
import googleSvg from "images/Google.svg";
import { Helmet } from "react-helmet";
import Input from "shared/Input/Input";
import { Link, useNavigate } from "react-router-dom";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import axios from "axios";

// ✅ Định nghĩa thủ công type cho lỗi Axios (axios 1.5 không export trực tiếp)
type AxiosErrorType = {
  isAxiosError: boolean;
  response?: {
    status?: number;
    data?: any;
  };
  message?: string;
};

// ✅ Hàm kiểm tra lỗi Axios
function isAxiosError(error: unknown): error is AxiosErrorType {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}

export interface PageLoginProps {
  className?: string;
}

const loginSocials = [
  { name: "Continue with Facebook", href: "#", icon: facebookSvg },
  { name: "Continue with Twitter", href: "#", icon: twitterSvg },
  { name: "Continue with Google", href: "#", icon: googleSvg },
];

const PageLogin: FC<PageLoginProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 URL API (ưu tiên .env)
  const API_URL = process.env.REACT_APP_API_URL || "https://localhost:7216/api";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 🔹 Kiểu dữ liệu trả về từ backend
    interface LoginResponse {
      token: string;
      user?: {
        userId: number;
        fullName: string;
        email: string;
        roleName?: string;
      };
    }

    try {
      const res = await axios.post<LoginResponse>(`${API_URL}/Auth/login`, {
        email,
        password,
      });

      if (res.status === 200 && res.data.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
        alert("Đăng nhập thành công!");
        navigate("/");
      } else {
        setError("Không nhận được token từ server.");
      }
    } catch (error: unknown) {
      // ✅ Bắt lỗi an toàn
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          setError("Email hoặc mật khẩu không đúng!");
        } else if (status === 400) {
          setError("Dữ liệu không hợp lệ!");
        } else {
          setError("Lỗi máy chủ. Vui lòng thử lại sau.");
        }
      } else {
        console.error(error);
        setError("Đã xảy ra lỗi không xác định!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`nc-PageLogin ${className}`} data-nc-id="PageLogin">
      <Helmet>
        <title>Login || Booking React Template</title>
      </Helmet>

      <div className="container mb-24 lg:mb-32">
        <h2 className="my-20 flex items-center text-3xl md:text-5xl font-semibold justify-center">
          Login
        </h2>

        <div className="max-w-md mx-auto space-y-6">
          {/* Social Login */}
          <div className="grid gap-3">
            {loginSocials.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="nc-will-change-transform flex w-full rounded-lg bg-primary-50 dark:bg-neutral-800 px-4 py-3 transition-transform hover:-translate-y-0.5"
              >
                <img className="flex-shrink-0" src={item.icon} alt={item.name} />
                <h3 className="flex-grow text-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {item.name}
                </h3>
              </a>
            ))}
          </div>

          {/* OR */}
          <div className="relative text-center">
            <span className="relative z-10 inline-block px-4 font-medium text-sm bg-white dark:bg-neutral-900">
              OR
            </span>
            <div className="absolute left-0 w-full top-1/2 transform -translate-y-1/2 border border-neutral-200 dark:border-neutral-800"></div>
          </div>

          {/* FORM */}
          <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                Email address
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
                Password
                <Link to="/forgot-pass" className="text-sm">
                  Forgot password?
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

            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            <ButtonPrimary type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </ButtonPrimary>
          </form>

          <span className="block text-center text-neutral-700 dark:text-neutral-300">
            New user? <Link to="/signup">Create an account</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageLogin;
