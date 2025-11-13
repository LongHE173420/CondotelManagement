import React, { FC, useState, useEffect, useCallback } from "react";
import facebookSvg from "images/Facebook.svg";
import twitterSvg from "images/Twitter.svg";
import googleSvg from "images/Google.svg";
import { Helmet } from "react-helmet";
import Input from "shared/Input/Input";
import { Link, useNavigate } from "react-router-dom";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { useAuth } from "contexts/AuthContext";
import { authAPI } from "api/auth";

// Declare Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, config: {
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            shape?: "rectangular" | "pill" | "circle" | "square";
            logo_alignment?: "left" | "center";
            width?: string | number;
          }) => void;
          prompt: (momentNotification?: (notification: {
            isNotMoment: boolean;
          }) => void) => void;
        };
      };
    };
  }
}

export interface PageLoginProps {
  className?: string;
}

const loginSocials = [
  { name: "Continue with Facebook", href: "#", icon: facebookSvg },
  { name: "Continue with Twitter", href: "#", icon: twitterSvg },
];

// Google OAuth Client ID - Cần thay bằng Client ID thực tế từ Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

const PageLogin: FC<PageLoginProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google Login
  const handleGoogleLogin = useCallback(async (idToken: string) => {
    setError("");
    setGoogleLoading(true);

    try {
      // Decode Google ID token to get user info (optional - backend will verify)
      // Backend sẽ verify token với Google Client ID từ appsettings.json
      let email = "";
      let fullName = "";
      let imageUrl = "";
      
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        email = payload.email || "";
        fullName = payload.name || "";
        imageUrl = payload.picture || "";
        console.log("📦 Google login payload (decoded):", { email, fullName, imageUrl });
      } catch (e) {
        console.warn("⚠️ Could not decode Google ID token (backend will verify):", e);
        // Continue anyway - backend will verify and extract info from token
      }

      // Send ID token to backend - backend will verify with Google Client ID from appsettings
      const response = await authAPI.googleLogin({
        idToken, // Backend sẽ verify token này với Google Client ID
        email, // Optional - backend có thể lấy từ verified token
        fullName, // Optional - backend có thể lấy từ verified token
        imageUrl, // Optional - backend có thể lấy từ verified token
      });

      console.log("✅ Google login response:", response);

      if (response.token && response.user) {
        // Lưu token và user vào context
        login(response.token, response.user);

        // Navigate based on role
        if (response.user.roleName === "Admin") {
          navigate("/admin");
        } else if (response.user.roleName === "Host") {
          navigate("/host-dashboard");
        } else {
          navigate("/");
        }
      } else {
        setError("Không nhận được dữ liệu từ server.");
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      
      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        if (status === 401) {
          setError("Xác thực Google thất bại. Vui lòng thử lại!");
        } else if (status === 400) {
          setError(error.response.data?.message || "Dữ liệu không hợp lệ!");
        } else if (status === 403) {
          setError("Truy cập bị từ chối. Kiểm tra CORS configuration.");
        } else if (status === 500) {
          setError("Lỗi máy chủ. Vui lòng thử lại sau.");
        } else {
          setError(error.response.data?.message || `Lỗi: ${status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        // Request made but no response (ERR_EMPTY_RESPONSE)
        console.error("❌ Backend không phản hồi:", {
          url: error.config?.url,
          message: error.message,
        });
        setError("Backend không phản hồi. Kiểm tra backend có đang chạy không (http://localhost:7216/api)");
      } else {
        // Error setting up request
        setError(`Không thể kết nối đến server: ${error.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [login, navigate]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("⚠️ Google Client ID chưa được cấu hình.");
      console.warn("📝 Hướng dẫn:");
      console.warn("   1. Tạo file .env trong root directory");
      console.warn("   2. Thêm: REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com");
      console.warn("   3. Restart development server (npm start)");
      console.warn("   Xem SETUP_GOOGLE_LOGIN.md để biết chi tiết");
      return;
    }

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            handleGoogleLogin(response.credential);
          },
        });

        // Render Google Sign-In button
        const buttonElement = document.getElementById("google-signin-button");
        if (buttonElement && window.google.accounts.id) {
          window.google.accounts.id.renderButton(buttonElement, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            width: "100%",
          });
        }
      }
    };

    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogleSignIn);
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);
  }, [handleGoogleLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      console.log("✅ Response data:", response);

      if (response.token && response.user) {
        // Lưu token và user vào context (context sẽ lưu vào localStorage)
        login(response.token, response.user);

        // Navigate based on role
        if (response.user.roleName === "Admin") {
          navigate("/admin");
        } else if (response.user.roleName === "Host") {
          navigate("/host-dashboard");
        } else {
          navigate("/");
        }
      } else {
        setError("Không nhận được dữ liệu từ server.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          setError("Email hoặc mật khẩu không đúng!");
        } else if (status === 400) {
          setError("Dữ liệu không hợp lệ!");
        } else if (status === 500) {
          setError("Lỗi máy chủ. Vui lòng thử lại sau.");
        } else {
          setError(error.response.data?.message || "Đã xảy ra lỗi!");
        }
      } else {
        setError("Không thể kết nối đến server!");
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
            {/* Facebook and Twitter (disabled for now) */}
            {loginSocials.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="nc-will-change-transform flex w-full rounded-lg bg-primary-50 dark:bg-neutral-800 px-4 py-3 transition-transform hover:-translate-y-0.5 opacity-50 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                <img className="flex-shrink-0" src={item.icon} alt={item.name} />
                <h3 className="flex-grow text-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {item.name}
                </h3>
              </a>
            ))}
            
            {/* Google Sign-In Button */}
            {GOOGLE_CLIENT_ID ? (
              <div className="w-full">
                <div id="google-signin-button" className="flex justify-center"></div>
                {googleLoading && (
                  <p className="text-center text-sm text-neutral-500 mt-2">
                    Đang xử lý đăng nhập Google...
                  </p>
                )}
              </div>
            ) : (
              <div className="flex w-full rounded-lg bg-neutral-100 dark:bg-neutral-800 px-4 py-3 opacity-50">
                <img className="flex-shrink-0" src={googleSvg} alt="Google" />
                <h3 className="flex-grow text-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Google Login (Chưa cấu hình)
                </h3>
              </div>
            )}
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
