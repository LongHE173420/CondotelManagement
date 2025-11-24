import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import condotelAPI, { CondotelDetailDTO } from "api/condotel";
import uploadAPI from "api/upload";
import Input from "shared/Input/Input";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import NcInputNumber from "components/NcInputNumber/NcInputNumber";

interface ImageDTO { imageUrl: string; caption?: string }
interface DetailDTO { buildingName?: string; roomNumber?: string }

const PageEditCondotel: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Availability: Active (còn phòng) | Inactive (hết phòng)
  const [status, setStatus] = useState("Inactive");
  const [beds, setBeds] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [pricePerNight, setPricePerNight] = useState<number>(0);
  const [images, setImages] = useState<ImageDTO[]>([]);
  const [details, setDetails] = useState<DetailDTO[]>([]);

  // Upload
  const [imgUrl, setImgUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      if (!user || user.roleName !== "Host") {
        navigate("/");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await condotelAPI.getByIdForHost(Number(id));
        setName(data.name || "");
        setDescription(data.description || "");
        // Chuẩn hóa về Active/Inactive để đồng bộ badge hiển thị
        const incomingStatus = (data.status || "").toString();
        const normalized = incomingStatus === "Available" ? "Active" : incomingStatus;
        setStatus(normalized === "Active" ? "Active" : "Inactive");
        setBeds(data.beds || 1);
        setBathrooms(data.bathrooms || 1);
        setPricePerNight(data.pricePerNight || 0);
        setImages((data.images || []).map((it: any) => ({ imageUrl: it.imageUrl, caption: it.caption })));
        setDetails((data.details || []).map((d: any) => ({ buildingName: d.buildingName, roomNumber: d.roomNumber })));
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Không thể tải condotel");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, navigate]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("File phải là ảnh");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Tối đa 10MB");
      return;
    }
    
    setUploading(true);
    setError("");
    
    try {
      const res = await uploadAPI.uploadImage(file);
      
      if (res?.imageUrl && res.imageUrl.trim()) {
        setImages((arr) => [...arr, { imageUrl: res.imageUrl, caption: file.name }]);
        // Clear error on success
        setError("");
      } else {
        setError("Upload thành công nhưng không nhận được URL ảnh. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err?.response?.data?.message 
        || err?.response?.data?.error
        || err?.message 
        || "Upload thất bại. Vui lòng kiểm tra kết nối và thử lại.";
      setError(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input để có thể chọn lại file cùng tên
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const addImageByUrl = () => {
    if (!imgUrl.trim()) return;
    setImages((arr) => [...arr, { imageUrl: imgUrl.trim() }]);
    setImgUrl("");
  };

  const removeImage = (index: number) => setImages((arr) => arr.filter((_, i) => i !== index));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!name.trim()) { setError("Vui lòng nhập tên condotel"); return; }
    if (pricePerNight <= 0) { setError("Giá mỗi đêm phải > 0"); return; }
    if (beds <= 0 || bathrooms <= 0) { setError("Số giường/phòng tắm phải > 0"); return; }

    setSaving(true);
    setError("");
    try {
      const payload: CondotelDetailDTO = {
        condotelId: Number(id),
        hostId: user?.userId || 0,
        name: name.trim(),
        description: description.trim() || undefined,
        pricePerNight,
        beds,
        bathrooms,
        status, // Active = còn phòng, Inactive = hết phòng
        images: images.length ? images.map((i, idx) => ({ imageId: idx, imageUrl: i.imageUrl, caption: i.caption })) : undefined,
        details: details.length ? details.map((d) => ({ ...d, beds, bathrooms })) : undefined,
      } as unknown as CondotelDetailDTO;

      await condotelAPI.update(Number(id), payload);
      alert("Cập nhật condotel thành công!");
      navigate("/host-dashboard?tab=condotels");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Không thể cập nhật condotel");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16 pt-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          <button
            onClick={() => navigate("/host-dashboard?tab=condotels")}
            className="hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-neutral-900 dark:text-neutral-100">Chỉnh sửa Condotel</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Chỉnh sửa Condotel</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">Cập nhật thông tin căn hộ của bạn</p>
          </div>
          {status === "Active" ? (
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 shadow-sm">
              ✓ Còn phòng
            </span>
          ) : (
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 shadow-sm">
              ✗ Hết phòng
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl whitespace-pre-line text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Thông tin cơ bản
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Tên condotel *
              </label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
                className="w-full"
                placeholder="Nhập tên condotel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100 resize-none"
                placeholder="Mô tả chi tiết về căn hộ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
                Tình trạng phòng *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    status === "Active"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="availability"
                    className="sr-only"
                    checked={status === "Active"}
                    onChange={() => setStatus("Active")}
                  />
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      status === "Active" ? "border-green-500 bg-green-500" : "border-neutral-400"
                    }`}>
                      {status === "Active" && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Còn phòng</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">Căn hộ đang có sẵn</div>
                    </div>
                  </div>
                </label>

                <label
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    status === "Inactive"
                      ? "border-gray-500 bg-gray-50 dark:bg-gray-900/20"
                      : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="availability"
                    className="sr-only"
                    checked={status === "Inactive"}
                    onChange={() => setStatus("Inactive")}
                  />
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      status === "Inactive" ? "border-gray-500 bg-gray-500" : "border-neutral-400"
                    }`}>
                      {status === "Inactive" && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">Hết phòng</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">Căn hộ đã hết chỗ</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Chi tiết */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Chi tiết căn hộ
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Số giường
                </label>
                <NcInputNumber defaultValue={beds} onChange={setBeds} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Số phòng tắm
                </label>
                <NcInputNumber defaultValue={bathrooms} onChange={setBathrooms} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Giá mỗi đêm (VNĐ) *
                </label>
                <NcInputNumber defaultValue={pricePerNight} onChange={setPricePerNight} />
              </div>
            </div>
          </div>
        </div>

        {/* Hình ảnh */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Hình ảnh ({images.length})
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Upload ảnh từ máy tính
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    file:cursor-pointer
                    cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span>Đang upload...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Chấp nhận: JPG, PNG, GIF (tối đa 10MB)
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Hoặc nhập URL hình ảnh
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  className="flex-1"
                />
                <ButtonSecondary type="button" onClick={addImageByUrl} disabled={!imgUrl.trim()}>
                  Thêm URL
                </ButtonSecondary>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img.imageUrl}
                      alt={`Hình ${i + 1}`}
                      className="w-full h-40 object-cover rounded-xl border-2 border-neutral-200 dark:border-neutral-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200?text=Image+Error";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                      title="Xóa ảnh"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <ButtonSecondary
            type="button"
            onClick={() => navigate("/host-dashboard?tab=condotels")}
            className="px-6"
          >
            Hủy
          </ButtonSecondary>
          <ButtonPrimary
            type="submit"
            disabled={saving}
            className="px-6"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang lưu...
              </span>
            ) : (
              "Cập nhật Condotel"
            )}
          </ButtonPrimary>
        </div>
      </form>
    </div>
  );
};

export default PageEditCondotel;


