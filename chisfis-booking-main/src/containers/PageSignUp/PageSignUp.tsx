import React, { FC, useState } from "react";
import { Helmet } from "react-helmet";
import Input from "shared/Input/Input";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "api/auth";
import { toast } from "react-toastify";

interface AxiosErrorLike {
  isAxiosError: boolean;
  response?: { status?: number; data?: any };
}

function isAxiosError(error: unknown): error is AxiosErrorLike {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}


const PageSignUp: FC<{ className?: string }> = ({ className = "" }) => {
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

  const [step, setStep] = useState<"form" | "verify">("form");
  const [otp, setOtp] = useState("");
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (error) setError("");
  };

  // ============ VALIDATE CLIENT-SIDE (giống hệt backend) ============
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Họ và tên
    if (!formData.fullName.trim()) {
      errors.fullName = "Họ và tên không được để trống";
    } else if (formData.fullName.trim().length > 100) {
      errors.fullName = "Họ và tên không được vượt quá 100 ký tự";
    }

    // Email
    if (!formData.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Email không đúng định dạng";
    }

    // Mật khẩu
    if (formData.password.length < 8) {
      errors.password = "Mật khẩu phải từ 8 ký tự trở lên và chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.";
    }

    // Số điện thoại (nếu có nhập)
    if (formData.phone && !/^0[3|5|7|8|9]\d{8}$/.test(formData.phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ (VD: 0901234567)";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  // ============ ĐĂNG KÝ ============
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setTermsError("");

    if (!acceptedTerms) {
      setTermsError("Vui lòng chấp nhận điều khoản sử dụng!");
      return;
    }

    if (!validateForm()) return;

    setRegistering(true);

    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      };
      if (formData.phone) payload.phone = formData.phone.trim();
      if (formData.gender) payload.gender = formData.gender;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.address) payload.address = formData.address.trim();

      const response = await authAPI.register(payload);
      setSuccessMessage("Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.");
      setStep("verify");
    } catch (error: unknown) {
      setFieldErrors({});

      if (isAxiosError(error) && error.response?.status === 400) {
        const errData = error.response.data;

        if (errData?.errors && typeof errData.errors === "object") {
          const newErrors: Record<string, string> = {};
          Object.keys(errData.errors).forEach(field => {
            const msg = Array.isArray(errData.errors[field]) ? errData.errors[field][0] : errData.errors[field];
            const key = field.toLowerCase();

            if (key.includes("password")) newErrors.password = msg;
            else if (key.includes("email")) newErrors.email = msg;
            else if (key.includes("fullname")) newErrors.fullName = msg;
            else newErrors[field.toLowerCase()] = msg;
          });
          setFieldErrors(newErrors);
          return;
        }
      }

      setError(isAxiosError(error) ? (error.response?.data?.message || "Đăng ký thất bại.") : "Lỗi mạng!");
    } finally {
      setRegistering(false);
    }
  };

  // ============ XÁC THỰC OTP ============
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Mã OTP phải đúng 6 chữ số");
      return;
    }
    setVerifying(true);
    try {
      await authAPI.verifyEmail({ email: formData.email, otp });
      toast.success("✅ Xác thực thành công! Đăng nhập ngay nhé!");
      navigate("/login");
    } catch (err) {
      const errorMsg = isAxiosError(err) ? (err.response?.data?.message || "OTP sai hoặc hết hạn") : "Lỗi mạng";
      toast.error(`❌ ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const payload = { ...formData, fullName: formData.fullName.trim(), email: formData.email.toLowerCase().trim() };
      await authAPI.register(payload);
      setSuccessMessage("Đã gửi lại OTP thành công!");
    } catch {
      setError("Gửi lại OTP thất bại");
    }
  };

  const renderInput = (label: string, name: keyof typeof formData, type = "text", placeholder = "", required = false) => (
    <div>
      <Input label={label} type={type} name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} required={required} />
      {fieldErrors[name] && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors[name]}</p>}
    </div>
  );

  return (
    <div className={`${className}`} data-nc-id="PageSignUp">
      <Helmet><title>Đăng ký || Condotel Booking</title></Helmet>

      <div className="container mb-24 lg:mb-32">
        <h2 className="my-20 text-center text-3xl md:text-5xl font-semibold">Tạo tài khoản mới</h2>

        <div className="max-w-md mx-auto space-y-6">

          {/* FORM */}
          {step === "form" ? (
            <form className="grid gap-5" onSubmit={handleRegister} noValidate>
              {renderInput("Họ và tên", "fullName", "text", "Nguyễn Văn A", true)}
              {renderInput("Email", "email", "email", "example@gmail.com", true)}

              <div className="space-y-1">
                <Input label="Mật khẩu" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                {fieldErrors.password && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password}</p>}
                <p className="text-xs text-neutral-500">Mật khẩu ≥ 8 ký tự, có chữ hoa, chữ thường và số</p>
              </div>

              {renderInput("Số điện thoại", "phone", "tel", "0901234567")}
              <div>
                <label className="text-neutral-800 dark:text-neutral-200 font-medium">Giới tính</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full mt-1 border rounded-2xl px-4 py-3">
                  <option value="">Chọn giới tính</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
                {fieldErrors.gender && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.gender}</p>}
              </div>

              {renderInput("Ngày sinh", "dateOfBirth", "date")}
              {renderInput("Địa chỉ", "address", "text", "Hà Nội, Việt Nam")}

              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms} onChange={e => { setAcceptedTerms(e.target.checked); setTermsError(""); }} className="mt-1" />
                  <span className="text-sm">Tôi đồng ý với <Link to="/terms" className="text-primary-600 underline">Điều khoản</Link> và <Link to="/privacy" className="text-primary-600 underline">Chính sách bảo mật</Link></span>
                </label>
                {termsError && <p className="text-red-500 text-sm ml-7">{termsError}</p>}
              </div>

              {error && !Object.keys(fieldErrors).length && <p className="text-red-500 text-center text-sm">{error}</p>}

              <ButtonPrimary type="submit" disabled={registering || !acceptedTerms}>
                {registering ? "Đang đăng ký..." : "Đăng ký"}
              </ButtonPrimary>
            </form>
          ) : (
            // OTP FORM
            <form className="grid gap-5" onSubmit={handleVerifyEmail}>
              <div>
                <label className="font-medium">Xác thực Email</label>
                <p className="text-sm text-neutral-600 mb-2">OTP đã gửi tới: <strong>{formData.email}</strong></p>
                {successMessage && <p className="text-green-600 text-sm mb-3">{successMessage}</p>}
                <Input label="Nhập mã OTP (6 số)" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} />
                <button type="button" onClick={handleResendOTP} className="text-sm text-primary-600 hover:underline mt-2">Gửi lại OTP</button>
              </div>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
              <div className="flex gap-3">
                <ButtonPrimary type="button" onClick={() => setStep("form")} className="flex-1 bg-gray-500">Quay lại</ButtonPrimary>
                <ButtonPrimary type="submit" disabled={verifying || otp.length !== 6} className="flex-1">
                  {verifying ? "Đang xác thực..." : "Xác thực"}
                </ButtonPrimary>
              </div>
            </form>
          )}

          {step === "form" && (
            <p className="text-center text-sm">
              Đã có tài khoản? <Link to="/login" className="text-primary-600 font-medium">Đăng nhập</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageSignUp;