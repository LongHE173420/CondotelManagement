import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Step1RequestEmail from "./components/Step1_RequestEmail";
import Step2VerifyCode from "./components/Step2_VerifyCode";
import Step3ResetPassword from "./components/Step3_ResetPassword";

// Định nghĩa các bước
type Step = "request_email" | "verify_code" | "reset_password";

const PageForgotPassword = () => {
  // State quản lý bước hiện tại
  const [step, setStep] = useState<Step>("request_email");
  
  // State lưu trữ dữ liệu qua các bước
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  const navigate = useNavigate();

  // Hàm callback khi Bước 1 thành công
  const handleEmailSuccess = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setStep("verify_code");
  };

  // Hàm callback khi Bước 2 thành công
  const handleCodeSuccess = (token: string) => {
    setVerificationToken(token);
    setStep("reset_password");
  };

  // Hàm callback khi Bước 3 thành công
  const handleResetSuccess = () => {
    // Chuyển hướng về trang login
    navigate("/login");
  };

  // Hàm render component con dựa trên state 'step'
  const renderStep = () => {
    switch (step) {
      case "request_email":
        return <Step1RequestEmail onSuccess={handleEmailSuccess} />;
      
      case "verify_code":
        return (
          <Step2VerifyCode 
            email={email} 
            onSuccess={handleCodeSuccess} 
          />
        );
      
      case "reset_password":
        return (
          <Step3ResetPassword
            email={email}
            token={verificationToken}
            onSuccess={handleResetSuccess}
          />
        );
      
      default:
        return null;
    }
  };

  // Thêm 1 div bọc ngoài để căn giữa mọi thứ
  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4">
      {renderStep()}
    </div>
  );
};

// Dòng này CỰC KỲ QUAN TRỌNG để sửa lỗi
export default PageForgotPassword;