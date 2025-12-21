import Label from "components/Label/Label";
import React, { FC, useState, useEffect, useRef } from "react";
import Avatar from "shared/Avatar/Avatar";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import Input from "shared/Input/Input";
import Select from "shared/Select/Select";
import CommonLayout from "./CommonLayout";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { authAPI } from "api/auth";
import { uploadAPI } from "api/upload";
import VerifiedBadge from "shared/Badge/VerifiedBadge";
import { packageAPI } from "api/package";

export interface AccountPageProps {
  className?: string;
  noLayout?: boolean;
}

const normalizeGender = (genderBE?: string): string => {
  if (!genderBE) return "";
  const g = genderBE.toLowerCase();
  if (g === "male" || g === "nam") return "Male";
  if (g === "female" || g === "nữ" || g === "nu") return "Female";
  if (g === "other" || g === "khác" || g === "khac") return "Other";
  return genderBE;
};

const AccountPage: FC<AccountPageProps> = ({ className = "", noLayout = false }) => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Đồng bộ dữ liệu từ user
  useEffect(() => {
    if (!user) return;

    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      gender: normalizeGender(user.gender),
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
      address: user.address || "",
    });

    const img = user.imageUrl || (user as any).ImageUrl;
    setImagePreview(img && typeof img === "string" && img.trim() ? img.trim() : null);
  }, [user]);

  // Load user nếu chưa có
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || user) return;
    const loadUser = async () => {
      try {
        const profile = await authAPI.getMe();
        updateUser(profile);
        if (profile.roleName === "Host") {
          const pkg = await packageAPI.getMyPackage();
          setIsVerified(pkg?.isVerifiedBadgeEnabled ?? false);
        }
      } catch (err) {
        setError("Không thể tải thông tin người dùng");
      }
    };
    loadUser();
  }, [user, updateUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name) setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Upload ảnh
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return setError("Vui lòng chọn file ảnh");
    if (file.size > 5 * 1024 * 1024) return setError("Ảnh không quá 5MB");

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setError("");
    setMessage("");

    try {
      const res = await uploadAPI.uploadUserImage(file);
      const url = res.imageUrl?.trim();
      if (!url) throw new Error("Không nhận được URL ảnh");

      setImagePreview(url);
      setMessage("Upload ảnh thành công!");

      // Cập nhật lại user từ API để đồng bộ
      const freshUser = await authAPI.getMe();
      updateUser(freshUser);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.response?.data?.message || "Upload ảnh thất bại");
      setImagePreview(user?.imageUrl || null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Cập nhật profile (CHỈ GỬI CÁC FIELD BACKEND NHẬN)
  const handleUpdate = async () => {
    if (!formData.fullName.trim()) return setError("Vui lòng nhập họ tên");

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
      };

      if (formData.phone?.trim()) payload.phone = formData.phone.trim();
      if (formData.gender) payload.gender = formData.gender;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.address?.trim()) payload.address = formData.address.trim();

      // BACKEND KHÔNG NHẬN ImageUrl → KHÔNG GỬI
      // Ảnh sẽ được cập nhật tự động qua uploadAPI + getMe()

      await authAPI.updateProfile(payload);

      const freshUser = await authAPI.getMe();
      updateUser(freshUser);
      setMessage("Cập nhật thông tin thành công!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const content = user ? (
    <div className="space-y-8">
      {!noLayout && <h2 className="text-3xl font-semibold">Thông tin tài khoản</h2>}
      {!noLayout && <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>}

      <div className="flex flex-col md:flex-row gap-10">
        {/* AVATAR - SIÊU RÕ RÀNG */}
        <div className="flex-shrink-0">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
              <Avatar
                sizeClass="w-40 h-40"
                imgUrl={imagePreview || undefined}
                userName={user.fullName}
              />
            </div>

            {/* Overlay nổi bật + icon camera */}
            <div
              className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center text-white">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium mt-1">Thay ảnh</span>
              </div>

              {uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* FORM */}
        <div className="flex-1 space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          <div>
            <Label>Email</Label>
            <Input className="mt-1.5" type="email" value={formData.email} disabled />
          </div>

          <div>
            <Label>Vai trò</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <Input value={user.roleName || "N/A"} disabled className="flex-1" />
              {isVerified && <VerifiedBadge size="md" />}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Ngày sinh</Label>
              <Input className="mt-1.5" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input className="mt-1.5" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div>
            <Label>Địa chỉ</Label>
            <Input className="mt-1.5" name="address" value={formData.address} onChange={handleChange} />
          </div>

          {/* NÚT TRỞ THÀNH CHỦ NHÀ - SIÊU ĐẸP */}
          {user.roleName === "Tenant" && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Trở thành chủ nhà ngay hôm nay!</h3>
                  <p className="text-white/90 mt-2">Cho thuê căn hộ và kiếm thêm thu nhập dễ dàng</p>
                </div>
                <Link to="/become-a-host">
                  <ButtonPrimary className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg">
                    Bắt đầu ngay
                  </ButtonPrimary>
                </Link>
              </div>
            </div>
          )}

          {message && <div className="p-4 bg-green-100 text-green-800 rounded-lg">{message}</div>}
          {error && <div className="p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>}

          <div className="pt-4">
            <ButtonPrimary onClick={handleUpdate} disabled={loading || uploadingImage} className="px-8">
              {loading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center py-20 text-red-600 text-lg">
      {error || "Đang tải thông tin..."}
    </div>
  );

  if (noLayout) {
    return <div className={`nc-AccountPage ${className}`}>{content}</div>;
  }

  return (
    <div className={`nc-AccountPage ${className}`} data-nc-id="AccountPage">
      <Helmet>
        <title>Thông tin tài khoản • Fiscondotel</title>
      </Helmet>
      <CommonLayout>{content}</CommonLayout>
    </div>
  );
};

export default AccountPage;