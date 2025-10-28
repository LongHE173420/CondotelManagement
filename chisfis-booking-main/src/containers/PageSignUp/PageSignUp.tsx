import React, { FC, useState } from "react";
import facebookSvg from "images/Facebook.svg";
import twitterSvg from "images/Twitter.svg";
import googleSvg from "images/Google.svg";
import { Helmet } from "react-helmet";
import Input from "shared/Input/Input";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Kiểu lỗi Axios
interface AxiosErrorLike {
  isAxiosError: boolean;
  response?: { status?: number; data?: any };
}
function isAxiosError(error: unknown): error is AxiosErrorLike {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}

export interface PageSignUpProps {
  className?: string;
}

const loginSocials = [
  { name: "Continue with Facebook", href: "#", icon: facebookSvg },
  { name: "Continue with Twitter", href: "#", icon: twitterSvg },
  { name: "Continue with Google", href: "#", icon: googleSvg },
];

const PageSignUp: FC<PageSignUpProps> = ({ className = "" }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "https://localhost:7216/api";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTermsError("");

    // Validate terms acceptance
    if (!acceptedTerms) {
      setTermsError("Vui lòng chấp nhận điều khoản sử dụng!");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/Auth/register`, formData);
      if (res.status === 201) {
        alert("🎉 Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } else {
        setError("Không thể đăng ký. Vui lòng thử lại!");
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 400) setError("Email đã tồn tại hoặc dữ liệu không hợp lệ!");
        else setError("Lỗi máy chủ. Vui lòng thử lại sau.");
      } else {
        console.error(error);
        setError("Đã xảy ra lỗi không xác định!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${className}`} data-nc-id="PageSignUp">
      <Helmet>
        <title>Sign up || Booking React Template</title>
      </Helmet>

      <div className="container mb-24 lg:mb-32">
        <h2 className="my-20 text-center text-3xl md:text-5xl font-semibold">
          Create Account
        </h2>

        <div className="max-w-md mx-auto space-y-6">
          {/* Social login */}
          <div className="grid gap-3">
            {loginSocials.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex w-full rounded-lg bg-primary-50 dark:bg-neutral-800 px-4 py-3 hover:-translate-y-0.5 transition-transform"
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
            <span className="relative z-10 px-4 bg-white dark:bg-neutral-900 text-sm text-neutral-500">
              OR
            </span>
            <div className="absolute left-0 top-1/2 w-full border-t border-neutral-300 dark:border-neutral-700"></div>
          </div>

          {/* FORM */}
          <form
            className="grid grid-cols-1 gap-5"
            onSubmit={handleRegister}
            style={{ opacity: 1, visibility: "visible", display: "block" }}
          >
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nguyen Van A"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0123456789"
            />

            <div>
              <label className="text-neutral-800 dark:text-neutral-200 font-medium">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border border-neutral-300 rounded-2xl px-4 py-3 mt-1 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value="">Select gender</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />

            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Hanoi, Vietnam"
            />

            {/* Terms and Conditions Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    setTermsError("");
                  }}
                  className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 dark:bg-neutral-800 dark:border-neutral-600"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Tôi đồng ý với{" "}
                  <Link
                    to="/terms"
                    className="text-primary-600 hover:text-primary-700 underline"
                    target="_blank"
                  >
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link
                    to="/privacy"
                    className="text-primary-600 hover:text-primary-700 underline"
                    target="_blank"
                  >
                    Chính sách bảo mật
                  </Link>
                </span>
              </label>
              {termsError && (
                <p className="text-red-500 text-sm ml-7">{termsError}</p>
              )}
            </div>

            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            <ButtonPrimary
              type="submit"
              disabled={loading || !acceptedTerms}
              className={!acceptedTerms ? "opacity-50 cursor-not-allowed" : ""}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </ButtonPrimary>
          </form>

          <p className="text-center text-neutral-700 dark:text-neutral-300">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageSignUp;
