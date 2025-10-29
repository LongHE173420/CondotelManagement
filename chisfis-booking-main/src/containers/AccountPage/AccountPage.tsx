import Label from "components/Label/Label";
import React, { FC, useState, useEffect, useRef } from "react";
import Avatar from "shared/Avatar/Avatar";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import Input from "shared/Input/Input";
import Select from "shared/Select/Select";
import Textarea from "shared/Textarea/Textarea";
import CommonLayout from "./CommonLayout";
import { Helmet } from "react-helmet";
import { useAuth } from "contexts/AuthContext";
import { authAPI } from "api/auth";
import { adminAPI } from "api/admin";
import { uploadAPI } from "api/upload";

export interface AccountPageProps {
  className?: string;
  noLayout?: boolean; // Skip CommonLayout for embedded use
}

const AccountPage: FC<AccountPageProps> = ({ className = "", noLayout = false }) => {
  const { user, updateUser, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    about: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userProfile = await authAPI.getMe();
        setFormData({
          fullName: userProfile.fullName || "",
          email: userProfile.email || "",
          phone: userProfile.phone || "",
          gender: userProfile.gender || "",
          dateOfBirth: userProfile.dateOfBirth || "",
          address: userProfile.address || "",
          about: "",
        });
        updateUser(userProfile);
      } catch (error: any) {
        console.error("Failed to load user data:", error);
        let errorMessage = "Không thể tải thông tin người dùng";
        
        if (error.networkError || error.noResponse) {
          errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      }
    };

    loadUserData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setUploadingImage(true);
    setError("");
    setMessage("");

    try {
      console.log("📤 Starting image upload...", file.name, file.size, file.type);
      const response = await uploadAPI.uploadUserImage(file);
      console.log("✅ Upload response:", response);
      
      if (!response || !response.imageUrl) {
        throw new Error("Invalid response from server");
      }
      
      // Refresh user data to get updated imageUrl
      const userProfile = await authAPI.getMe();
      updateUser(userProfile);
      
      setMessage("Cập nhật ảnh đại diện thành công!");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        networkError: error.networkError,
        code: error.code,
      });
      
      let errorMessage = "Không thể upload ảnh. Vui lòng thử lại!";
      
      if (error.networkError || error.noResponse) {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc đảm bảo backend đang chạy.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 413) {
        errorMessage = "File quá lớn. Vui lòng chọn file nhỏ hơn.";
      } else if (error.response?.status === 400) {
        errorMessage = "File không hợp lệ. Vui lòng chọn file ảnh khác.";
      } else if (error.code === "ECONNREFUSED") {
        errorMessage = "Kết nối bị từ chối. Vui lòng kiểm tra xem backend server có đang chạy không.";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Lỗi mạng. Vui lòng kiểm tra kết nối internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isAdmin && user?.userId) {
        // Nếu là Admin, dùng admin API
        await adminAPI.updateUser(user.userId, {
          fullName: formData.fullName,
          phone: formData.phone,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
        });
      } else {
        // User thường thì có thể dùng API khác nếu có
        setMessage("Cập nhật thành công!");
      }

      // Refresh user data
      const userProfile = await authAPI.getMe();
      updateUser(userProfile);
      setMessage("Cập nhật thông tin thành công!");
    } catch (error: any) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || "Không thể cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADING */}
      {!noLayout && <h2 className="text-3xl font-semibold">Account infomation</h2>}
      {!noLayout && <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>}
          <div className="flex flex-col md:flex-row">
            <div className="flex-shrink-0 flex items-start">
              <div className="relative rounded-full overflow-hidden flex">
                <Avatar 
                  sizeClass="w-32 h-32" 
                  imgUrl={user?.imageUrl}
                  userName={user?.fullName}
                />
                <div 
                  className={`absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-neutral-50 cursor-pointer transition-opacity ${
                    uploadingImage ? "opacity-80" : "hover:bg-opacity-70"
                  }`}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                      <span className="text-xs">Đang upload...</span>
                    </div>
                  ) : (
                    <>
                      <svg
                        width="30"
                        height="30"
                        viewBox="0 0 30 30"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17.5 5H7.5C6.83696 5 6.20107 5.26339 5.73223 5.73223C5.26339 6.20107 5 6.83696 5 7.5V20M5 20V22.5C5 23.163 5.26339 23.7989 5.73223 24.2678C6.20107 24.7366 6.83696 25 7.5 25H22.5C23.163 25 23.7989 24.7366 24.2678 24.2678C24.7366 23.7989 25 23.163 25 22.5V17.5M5 20L10.7325 14.2675C11.2013 13.7988 11.8371 13.5355 12.5 13.5355C13.1629 13.5355 13.7987 13.7988 14.2675 14.2675L17.5 17.5M25 12.5V17.5M25 17.5L23.0175 15.5175C22.5487 15.0488 21.9129 14.7855 21.25 14.7855C20.5871 14.7855 19.9513 15.0488 19.4825 15.5175L17.5 17.5M17.5 17.5L20 20M22.5 5H27.5M25 2.5V7.5M17.5 10H17.5125"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="mt-1 text-xs">Change Image</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={uploadingImage}
                />
              </div>
            </div>
            <div className="flex-grow mt-10 md:mt-0 md:pl-16 max-w-3xl space-y-6">
              <div>
                <Label>Họ tên</Label>
                <Input
                  className="mt-1.5"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              {/* ---- */}
              <div>
                <Label>Giới tính</Label>
                <Select
                  className="mt-1.5"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </Select>
              </div>
              {/* ---- */}
              <div>
                <Label>Email</Label>
                <Input
                  className="mt-1.5"
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                />
              </div>
              {/* ---- */}
              <div>
                <Label>Role</Label>
                <Input
                  className="mt-1.5"
                  value={user?.roleName || ""}
                  disabled
                />
              </div>
              {/* ---- */}
              <div className="max-w-lg">
                <Label>Ngày sinh</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              {/* ---- */}
              <div>
                <Label>Địa chỉ</Label>
                <Input
                  className="mt-1.5"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Hanoi, Vietnam"
                />
              </div>
              {/* ---- */}
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  className="mt-1.5"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0123456789"
                />
              </div>
              {/* ---- */}
              <div>
                <Label>Giới thiệu</Label>
                <Textarea
                  className="mt-1.5"
                  name="about"
                  value={formData.about}
                  onChange={handleTextareaChange}
                  placeholder="Giới thiệu về bạn..."
                />
              </div>

              {/* Message */}
              {message && (
                <div className="p-4 bg-green-100 text-green-800 rounded-lg text-sm">
                  {message}
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <ButtonPrimary onClick={handleUpdate} disabled={loading}>
                  {loading ? "Đang cập nhật..." : "Cập nhật thông tin"}
                </ButtonPrimary>
              </div>
            </div>
          </div>
    </div>
  );

  if (noLayout) {
    return (
      <div className={`nc-AccountPage ${className}`} data-nc-id="AccountPage">
        {content}
      </div>
    );
  }

  return (
    <div className={`nc-AccountPage ${className}`} data-nc-id="AccountPage">
      <Helmet>
        <title>Account || Booking React Template</title>
      </Helmet>
      <CommonLayout>
        {content}
      </CommonLayout>
    </div>
  );
};

export default AccountPage;
