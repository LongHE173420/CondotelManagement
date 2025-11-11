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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update imagePreview when user changes
  useEffect(() => {
    if (user?.imageUrl && user.imageUrl.trim() !== "") {
      console.log("🖼️ Updating imagePreview from user context:", user.imageUrl);
      setImagePreview(user.imageUrl);
    }
  }, [user?.imageUrl]);

  // Load user data when component mounts
  useEffect(() => {
    // Kiểm tra token trước khi gọi API
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token found, cannot load user data");
      setError("Bạn cần đăng nhập để xem thông tin");
      return;
    }
    
    const loadUserData = async () => {
      try {
        console.log("🔑 Token exists, calling getMe API...");
        const userProfile = await authAPI.getMe();
        console.log("📥 Full user profile from API:", userProfile);
        console.log("📥 imageUrl value:", userProfile.imageUrl);
        console.log("📥 imageUrl type:", typeof userProfile.imageUrl);
        console.log("📥 imageUrl length:", userProfile.imageUrl?.length);
        
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
        
        // Cập nhật preview nếu có imageUrl từ server
        // Kiểm tra cả imageUrl và ImageUrl (case insensitive)
        const imageUrl = userProfile.imageUrl || (userProfile as any).ImageUrl;
        if (imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== "") {
          console.log("✅ Setting imagePreview from API:", imageUrl);
          setImagePreview(imageUrl);
        } else {
          console.log("⚠️ No valid imageUrl in user profile. Available fields:", Object.keys(userProfile));
          setImagePreview(null);
        }
      } catch (error: any) {
        console.error("Failed to load user data:", error);
        
        // Xử lý lỗi 401 - Unauthorized
        if (error.response?.status === 401) {
          console.error("❌ 401 Unauthorized - Token expired or invalid");
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          // Axios interceptor sẽ tự động redirect về login
        } else {
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

    // Tạo preview ảnh ngay khi chọn file
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setError("");
    setMessage("");

    try {
      console.log("📤 Starting image upload...", file.name, file.size, file.type);
      const response = await uploadAPI.uploadUserImage(file);
      console.log("✅ Upload response:", response);
      
      // Kiểm tra response structure - có thể là { imageUrl } hoặc { message, imageUrl }
      const imageUrl = response.imageUrl || (response as any).ImageUrl;
      
      if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
        console.error("❌ Invalid imageUrl in response:", response);
        throw new Error("Không nhận được URL ảnh từ server");
      }
      
      console.log("✅ Image URL received:", imageUrl);
      
      // Cập nhật preview với URL mới từ server
      setImagePreview(imageUrl);
      
      // Cập nhật imageUrl vào profile qua API updateProfile
      // Đảm bảo ảnh được lưu vào database và hiển thị ngay
      let updateSuccess = false;
      try {
        const currentUser = await authAPI.getMe();
        console.log("📤 Preparing to update profile with imageUrl:", imageUrl);
        console.log("📤 Current user fullName:", currentUser.fullName);
        
        // Đảm bảo imageUrl là string hợp lệ
        const imageUrlToSend = imageUrl && typeof imageUrl === "string" ? imageUrl.trim() : "";
        
        if (!imageUrlToSend) {
          throw new Error("ImageUrl is empty or invalid");
        }
        
        console.log("📤 Sending updateProfile request with:", {
          fullName: currentUser.fullName,
          imageUrl: imageUrlToSend,
        });
        
        const updateResult = await authAPI.updateProfile({
          fullName: currentUser.fullName,
          imageUrl: imageUrlToSend, // Đảm bảo gửi string hợp lệ
        });
        
        console.log("✅ ImageUrl updated in profile successfully:", updateResult);
        updateSuccess = true;
      } catch (updateError: any) {
        console.error("❌ Failed to update imageUrl in profile:", updateError);
        console.error("❌ Error details:", {
          status: updateError.response?.status,
          statusText: updateError.response?.statusText,
          data: updateError.response?.data,
          message: updateError.message,
          stack: updateError.stack,
        });
        
        // Vẫn hiển thị message thành công vì upload đã thành công
        // Nhưng cảnh báo user rằng cần cập nhật profile để lưu ảnh
        const errorMsg = updateError.response?.data?.message || updateError.message || "Unknown error";
        setMessage("Upload ảnh thành công! Nhưng cần cập nhật profile để lưu ảnh đại diện.");
        setError(`Không thể cập nhật ảnh vào profile: ${errorMsg}`);
      }
      
      // Refresh user data to get updated imageUrl
      try {
        const userProfile = await authAPI.getMe();
        console.log("✅ User profile refreshed. ImageUrl:", userProfile.imageUrl);
        
        // Cập nhật AuthContext để Header và các component khác hiển thị ảnh mới
        updateUser(userProfile);
        
        // Nếu không có lỗi update, hiển thị message thành công
        if (updateSuccess) {
          setMessage("Cập nhật ảnh đại diện thành công!");
          setError(""); // Clear any previous errors
        }
      } catch (refreshError: any) {
        console.error("❌ Failed to refresh user profile:", refreshError);
        // Vẫn hiển thị message thành công vì upload đã thành công
        if (updateSuccess) {
          setMessage("Upload ảnh thành công! Vui lòng reload trang để xem ảnh.");
        }
      }
      
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
      // Xóa preview nếu upload thất bại
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    // Validate required fields
    if (!formData.fullName || formData.fullName.trim() === "") {
      setError("Vui lòng nhập họ tên");
      setLoading(false);
      return;
    }
    
    if (!formData.email || formData.email.trim() === "") {
      setError("Vui lòng nhập email");
      setLoading(false);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Email không đúng định dạng");
      setLoading(false);
      return;
    }

    try {
      // Chuẩn bị data để gửi theo UpdateProfileRequest DTO
      // Backend nhận: FullName (required), Email, Phone, Gender, DateOfBirth, Address, ImageUrl
      const updateData: {
        fullName: string;
        email?: string;
        phone?: string;
        gender?: string;
        dateOfBirth?: string;
        address?: string;
        imageUrl?: string;
      } = {
        fullName: formData.fullName.trim(),
      };
      
      // Thêm email nếu có
      if (formData.email && formData.email.trim()) {
        updateData.email = formData.email.trim();
      }
      
      // Chỉ thêm các fields có giá trị (trừ empty strings)
      if (formData.phone && formData.phone.trim()) {
        updateData.phone = formData.phone.trim();
      }
      if (formData.gender && formData.gender.trim()) {
        updateData.gender = formData.gender.trim();
      }
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        // Format date để backend nhận được (YYYY-MM-DD) - backend sẽ parse sang DateOnly
        updateData.dateOfBirth = formData.dateOfBirth.trim();
      }
      if (formData.address && formData.address.trim()) {
        updateData.address = formData.address.trim();
      }
      
      // Nếu có imagePreview (ảnh đã upload), cập nhật imageUrl
      // Chỉ gửi nếu là URL (không phải data URL từ FileReader)
      if (imagePreview && imagePreview.trim() && !imagePreview.startsWith("data:")) {
        updateData.imageUrl = imagePreview.trim();
      }

      console.log("📤 Updating profile with data:", updateData);
      
      // Dùng Profile/me API cho tất cả user (Admin, Host, Tenant, Owner)
      await authAPI.updateProfile(updateData);

      // Refresh user data để lấy thông tin mới nhất (bao gồm imageUrl)
      const userProfile = await authAPI.getMe();
      console.log("✅ Updated user profile with avatar:", userProfile.imageUrl);
      updateUser(userProfile);
      setMessage("Cập nhật thông tin thành công!");
    } catch (error: any) {
      console.error("❌ Update error:", error);
      console.error("❌ Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      let errorMessage = "Không thể cập nhật thông tin!";
      
      // Xử lý validation errors từ backend
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        
        // Backend có thể trả về:
        // 1. String message trực tiếp: "Error message"
        // 2. Object với message property: { message: "Error message" }
        // 3. Object với errors property (ModelState): { errors: { field: ["error1", "error2"] } }
        
        if (typeof errorData === "string") {
          // Backend trả về string message trực tiếp (BadRequest(result.Message))
          errorMessage = errorData;
        } else if (errorData?.errors) {
          // Backend trả về ModelState errors (object với keys là field names)
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
              const errorList = Array.isArray(messages) ? messages.join(", ") : messages;
              return `${fieldName}: ${errorList}`;
            })
            .join("\n");
          errorMessage = `Lỗi validation:\n${validationErrors}`;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.";
        }
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = "Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy người dùng.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
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
                {(() => {
                  const avatarUrl = imagePreview || user?.imageUrl;
                  console.log("🖼️ Avatar rendering with:", {
                    imagePreview,
                    userImageUrl: user?.imageUrl,
                    finalUrl: avatarUrl,
                    userFullName: user?.fullName
                  });
                  return (
                    <Avatar 
                      sizeClass="w-32 h-32" 
                      imgUrl={avatarUrl || undefined}
                      userName={user?.fullName}
                    />
                  );
                })()}
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
                <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm whitespace-pre-line">
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
