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
import { uploadAPI } from "api/upload";

export interface AccountPageProps {
  className?: string;
  noLayout?: boolean;
}

const AccountPage: FC<AccountPageProps> = ({ className = "", noLayout = false }) => {
  const { user, updateUser } = useAuth();
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

  useEffect(() => {
    if (user?.imageUrl && user.imageUrl.trim()) {
      setImagePreview(user.imageUrl.trim());
    }
  }, [user?.imageUrl]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Bạn cần đăng nhập để xem thông tin");
      return;
    }

    const loadUserData = async () => {
      try {
        const userProfile = await authAPI.getMe();
        setFormData({
          fullName: userProfile.fullName || "",
          email: userProfile.email || "",
          phone: userProfile.phone || "",
          gender: userProfile.gender || "",
          dateOfBirth: (userProfile.dateOfBirth || "").split("T")[0],
          address: userProfile.address || "",
          about: "",
        });
        updateUser(userProfile);

        const imageUrl = userProfile.imageUrl || (userProfile as any).ImageUrl;
        if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
          setImagePreview(imageUrl.trim());
        } else {
          setImagePreview(null);
        }
      } catch (err: any) {
        const msg = err.response?.status === 401
          ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
          : err.response?.data?.message || "Không thể tải thông tin người dùng";
        setError(msg);
      }
    };

    loadUserData();
  }, [updateUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setError("");
    setMessage("");

    try {
      const response = await uploadAPI.uploadUserImage(file);
      const imageUrl = response.imageUrl;

      if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
        throw new Error("Không nhận được URL ảnh từ server");
      }

      setImagePreview(imageUrl.trim());
      setMessage("Cập nhật ảnh đại diện thành công!");

      const updatedUser = await authAPI.getMe();
      updateUser(updatedUser);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể upload ảnh");
      setImagePreview(user?.imageUrl || null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.fullName.trim()) {
      setError("Vui lòng nhập họ tên");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updateData: any = {
        fullName: formData.fullName.trim(),
      };

      if (formData.phone?.trim()) updateData.phone = formData.phone.trim();
      if (formData.gender?.trim()) updateData.gender = formData.gender.trim();
      if (formData.dateOfBirth?.trim()) updateData.dateOfBirth = formData.dateOfBirth.trim();
      if (formData.address?.trim()) updateData.address = formData.address.trim();

      if (imagePreview && !imagePreview.startsWith("data:") && imagePreview.trim()) {
        updateData.imageUrl = imagePreview.trim();
      }

      await authAPI.updateProfile(updateData);

      const updatedUser = await authAPI.getMe();
      updateUser(updatedUser);

      setMessage("Cập nhật thông tin thành công!");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể cập nhật thông tin";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-6 sm:space-y-8">
      {!noLayout && <h2 className="text-3xl font-semibold">Thông tin tài khoản</h2>}
      {!noLayout && <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>}

      <div className="flex flex-col md:flex-row">
        <div className="flex-shrink-0 flex items-start">
          <div className="relative rounded-full overflow-hidden">
            <Avatar sizeClass="w-32 h-32" imgUrl={imagePreview || undefined} userName={user?.fullName} />
            <div
              className={`absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-neutral-50 cursor-pointer transition-opacity ${uploadingImage ? "opacity-80" : "hover:bg-opacity-70"
                }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingImage ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                  <span className="text-xs">Đang upload...</span>
                </div>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M14.828 9.172a4 4 0 11-5.656 0 4 4 0 015.656 0z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span className="mt-1 text-xs">Thay ảnh</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploadingImage}
            />
          </div>
        </div>

        <div className="flex-grow mt-10 md:mt-0 md:pl-16 max-w-3xl space-y-6">
          <div>
            <Label>Họ tên *</Label>
            <Input className="mt-1.5" name="fullName" value={formData.fullName} onChange={handleChange} />
          </div>

          <div>
            <Label>Giới tính</Label>
            <Select className="mt-1.5" name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </Select>
          </div>

          <div>
            <Label>Email</Label>
            <Input className="mt-1.5" type="email" value={formData.email} disabled />
          </div>

          <div>
            <Label>Vai trò</Label>
            <Input className="mt-1.5" value={user?.roleName || "N/A"} disabled />
          </div>

          <div className="max-w-lg">
            <Label>Ngày sinh</Label>
            <Input className="mt-1.5" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
          </div>

          <div>
            <Label>Địa chỉ</Label>
            <Input className="mt-1.5" name="address" value={formData.address} onChange={handleChange} placeholder="Hà Nội, Việt Nam" />
          </div>

          <div>
            <Label>Số điện thoại</Label>
            <Input className="mt-1.5" name="phone" value={formData.phone} onChange={handleChange} placeholder="0123456789" />
          </div>

          <div>
            <Label>Giới thiệu</Label>
            <Textarea className="mt-1.5" name="about" value={formData.about} onChange={handleTextareaChange} placeholder="Giới thiệu về bạn..." rows={4} />
          </div>

          {message && <div className="p-4 bg-green-100 text-green-800 rounded-lg text-sm">{message}</div>}
          {error && <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm whitespace-pre-line">{error}</div>}

          <div className="pt-2">
            <ButtonPrimary onClick={handleUpdate} disabled={loading || uploadingImage}>
              {loading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </div>
  );

  if (noLayout) {
    return <div className={`nc-AccountPage ${className}`}>{content}</div>;
  }

  return (
    <div className={`nc-AccountPage ${className}`} data-nc-id="AccountPage">
      <Helmet>
        <title>Thông tin tài khoản || Condotel Management</title>
      </Helmet>
      <CommonLayout>{content}</CommonLayout>
    </div>
  );
};

export default AccountPage;