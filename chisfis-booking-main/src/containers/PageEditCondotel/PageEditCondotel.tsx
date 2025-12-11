import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import condotelAPI, { CondotelDetailDTO, PriceDTO, DetailDTO as CondotelDetailDTOType } from "api/condotel";
import uploadAPI from "api/upload";
import resortAPI, { ResortDTO } from "api/resort";
import amenityAPI, { AmenityDTO } from "api/amenity";
import utilityAPI, { UtilityDTO } from "api/utility";
import Input from "shared/Input/Input";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import NcInputNumber from "components/NcInputNumber/NcInputNumber";
import { toastSuccess, showErrorMessage } from "utils/toast";

interface ImageDTO { imageUrl: string; caption?: string }

// Component để hiển thị từng ảnh với xử lý lỗi
const ImageItem: React.FC<{ img: ImageDTO; index: number; onRemove: () => void }> = ({ img, index, onRemove }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative group">
      {!imageError ? (
        <img
          src={img.imageUrl}
          alt={`Hình ${index + 1}`}
          className="w-full h-40 object-cover rounded-xl border-2 border-neutral-200 dark:border-neutral-700"
          onError={(e) => {
            console.error("❌ Image load error:", img.imageUrl);
            setImageError(true);
          }}
        />
      ) : (
        <div className="w-full h-40 bg-neutral-200 dark:bg-neutral-700 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
        title="Xóa ảnh"
      >
        ×
      </button>
    </div>
  );
};

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
  const [resortId, setResortId] = useState<number | undefined>(undefined);
  const [images, setImages] = useState<ImageDTO[]>([]);
  const [prices, setPrices] = useState<PriceDTO[]>([]);
  const [details, setDetails] = useState<CondotelDetailDTOType[]>([]);
  const [amenityIds, setAmenityIds] = useState<number[]>([]);
  const [utilityIds, setUtilityIds] = useState<number[]>([]);

  // Options for dropdowns
  const [resorts, setResorts] = useState<ResortDTO[]>([]);
  const [amenities, setAmenities] = useState<AmenityDTO[]>([]);
  const [utilities, setUtilities] = useState<UtilityDTO[]>([]);

  // Upload
  const [imgUrl, setImgUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        console.warn("⚠️ No condotel ID provided");
        setError("Không tìm thấy ID condotel");
        setLoading(false);
        return;
      }
      if (!user || user.roleName !== "Host") {
        console.warn("⚠️ User is not a Host, redirecting...");
        navigate("/");
        return;
      }
      setLoading(true);
      setError("");
      try {
        // Load condotel data
        console.log("📥 Loading condotel data for ID:", id);
        console.log("📥 User:", user);
        const data = await condotelAPI.getByIdForHost(Number(id));
        console.log("✅ Condotel data loaded:", data);
        console.log("✅ Data keys:", Object.keys(data));
        
        setName(data.name || "");
        setDescription(data.description || "");
        // Chuẩn hóa về Active/Inactive để đồng bộ badge hiển thị
        const incomingStatus = (data.status || "").toString();
        const normalized = incomingStatus === "Available" ? "Active" : incomingStatus;
        setStatus(normalized === "Active" ? "Active" : "Inactive");
        setBeds(data.beds || 1);
        setBathrooms(data.bathrooms || 1);
        setPricePerNight(data.pricePerNight || 0);
        setResortId(data.resortId);
        
        console.log("📝 Set form values:", {
          name: data.name,
          description: data.description,
          status: normalized === "Active" ? "Active" : "Inactive",
          beds: data.beds,
          bathrooms: data.bathrooms,
          pricePerNight: data.pricePerNight,
          resortId: data.resortId,
          imagesCount: (data.images || []).length,
          pricesCount: (data.prices || []).length,
          detailsCount: (data.details || []).length,
          amenitiesCount: (data.amenities || []).length,
          utilitiesCount: (data.utilities || []).length,
        });
        setImages((data.images || []).map((it: any) => ({ imageUrl: it.imageUrl, caption: it.caption })));
        setPrices((data.prices || []).map((p: any) => {
          // Normalize priceType: map từ tiếng Anh sang tiếng Việt hoặc giữ nguyên nếu đã là tiếng Việt
          const incomingPriceType = p.priceType || p.PriceType || "";
          
          // Map từ tiếng Anh sang tiếng Việt (nếu backend trả về tiếng Anh)
          const priceTypeMap: Record<string, string> = {
            "Default": "Thường",
            "Weekend": "Cuối tuần",
            "Holiday": "Ngày lễ",
            "Seasonal": "Cao điểm",
            "PeakSeason": "Cao điểm",
            // Giữ nguyên nếu đã là tiếng Việt
            "Thường": "Thường",
            "Cuối tuần": "Cuối tuần",
            "Ngày lễ": "Ngày lễ",
            "Cao điểm": "Cao điểm",
          };
          
          const normalizedPriceType = priceTypeMap[incomingPriceType] || "Thường";
          
          return {
            priceId: p.priceId || 0,
            startDate: p.startDate || "",
            endDate: p.endDate || "",
            basePrice: p.basePrice || 0,
            priceType: normalizedPriceType,
            description: p.description || "",
          };
        }));
        setDetails((data.details || []).map((d: any) => ({
          buildingName: d.buildingName,
          roomNumber: d.roomNumber,
          beds: d.beds,
          bathrooms: d.bathrooms,
          safetyFeatures: d.safetyFeatures,
          hygieneStandards: d.hygieneStandards,
        })));
        // Extract amenityIds and utilityIds from arrays
        setAmenityIds((data.amenities || []).map((a: any) => a.amenityId || a.AmenityId));
        setUtilityIds((data.utilities || []).map((u: any) => u.utilityId || u.UtilityId));

        // Load options for dropdowns
        const [resortsData, amenitiesData, utilitiesData] = await Promise.all([
          resortAPI.getAll().catch(() => []),
          amenityAPI.getAll().catch(() => []),
          utilityAPI.getAll().catch(() => []),
        ]);
        setResorts(resortsData);
        setAmenities(amenitiesData);
        setUtilities(utilitiesData);
      } catch (e: any) {
        console.error("❌ Error loading condotel:", e);
        console.error("❌ Error response:", e?.response?.data);
        console.error("❌ Error message:", e?.message);
        setError(e?.response?.data?.message || e?.message || "Không thể tải condotel");
      } finally {
        setLoading(false);
        console.log("✅ Loading completed");
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
        resortId: resortId,
        name: name.trim(),
        description: description.trim() || undefined,
        pricePerNight,
        beds,
        bathrooms,
        status, // Active = còn phòng, Inactive = hết phòng
        images: images.length ? images.map((i, idx) => ({ imageId: idx, imageUrl: i.imageUrl, caption: i.caption })) : undefined,
        prices: prices.length > 0 ? prices : undefined,
        details: details.length > 0 ? details : undefined,
        // Note: Backend expects amenityIds and utilityIds, but CondotelDetailDTO has amenities/utilities arrays
        // We'll need to check the update API to see if it accepts IDs or objects
      } as CondotelDetailDTO;

      // For update, we need to send amenityIds and utilityIds
      // But CondotelDetailDTO doesn't have these fields, so we'll add them to the payload
      const updatePayload: any = {
        ...payload,
        amenityIds: amenityIds.length > 0 ? amenityIds : undefined,
        utilityIds: utilityIds.length > 0 ? utilityIds : undefined,
      };

      await condotelAPI.update(Number(id), updatePayload);
      toastSuccess("Cập nhật condotel thành công!");
      setTimeout(() => {
        navigate("/host-dashboard?tab=condotels");
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Không thể cập nhật condotel");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-neutral-600 dark:text-neutral-400">Đang tải dữ liệu condotel...</p>
      </div>
    );
  }

  // Debug: Log current state values
  console.log("🔍 Current form state:", {
    name,
    description,
    status,
    beds,
    bathrooms,
    pricePerNight,
    resortId,
    imagesCount: images.length,
    pricesCount: prices.length,
    detailsCount: details.length,
    amenityIdsCount: amenityIds.length,
    utilityIdsCount: utilityIds.length,
  });

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

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Resort
              </label>
              <select
                value={resortId || ""}
                onChange={(e) => setResortId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
              >
                <option value="">-- Chọn Resort --</option>
                {resorts.map((resort) => (
                  <option key={resort.resortId} value={resort.resortId}>
                    {resort.name}
                  </option>
                ))}
              </select>
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
                <NcInputNumber key={`beds-${beds}`} defaultValue={beds} onChange={setBeds} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Số phòng tắm
                </label>
                <NcInputNumber key={`bathrooms-${bathrooms}`} defaultValue={bathrooms} onChange={setBathrooms} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Giá mỗi đêm (VNĐ) *
                </label>
                <NcInputNumber key={`price-${pricePerNight}`} defaultValue={pricePerNight} onChange={setPricePerNight} />
              </div>
            </div>
          </div>
        </div>

        {/* Prices */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Giá theo thời gian
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {prices.map((price, index) => (
              <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Ngày bắt đầu
                    </label>
                    <Input
                      type="date"
                      value={price.startDate}
                      onChange={(e) => {
                        const newPrices = [...prices];
                        newPrices[index].startDate = e.target.value;
                        setPrices(newPrices);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Ngày kết thúc
                    </label>
                    <Input
                      type="date"
                      value={price.endDate}
                      onChange={(e) => {
                        const newPrices = [...prices];
                        newPrices[index].endDate = e.target.value;
                        setPrices(newPrices);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Giá cơ bản (VNĐ)
                    </label>
                    <NcInputNumber
                      defaultValue={price.basePrice}
                      onChange={(val) => {
                        const newPrices = [...prices];
                        newPrices[index].basePrice = val;
                        setPrices(newPrices);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Loại giá
                    </label>
                    <select
                      value={price.priceType}
                      onChange={(e) => {
                        const newPrices = [...prices];
                        newPrices[index].priceType = e.target.value;
                        setPrices(newPrices);
                      }}
                      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="Thường">Thường</option>
                      <option value="Cuối tuần">Cuối tuần</option>
                      <option value="Ngày lễ">Ngày lễ</option>
                      <option value="Cao điểm">Cao điểm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Mô tả
                    </label>
                    <Input
                      value={price.description}
                      onChange={(e) => {
                        const newPrices = [...prices];
                        newPrices[index].description = e.target.value;
                        setPrices(newPrices);
                      }}
                      className="w-full"
                      placeholder="Mô tả giá"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrices(prices.filter((_, i) => i !== index))}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Xóa giá này
                </button>
              </div>
            ))}
            <ButtonSecondary
              type="button"
              onClick={() => setPrices([...prices, {
                priceId: 0,
                startDate: "",
                endDate: "",
                basePrice: 0,
                priceType: "Thường",
                description: "",
              }])}
            >
              + Thêm giá mới
            </ButtonSecondary>
          </div>
        </div>

        {/* Details với safetyFeatures và hygieneStandards */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Chi tiết phòng
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {details.map((detail, index) => (
              <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Tên tòa nhà
                    </label>
                    <Input
                      value={detail.buildingName || ""}
                      onChange={(e) => {
                        const newDetails = [...details];
                        newDetails[index].buildingName = e.target.value;
                        setDetails(newDetails);
                      }}
                      className="w-full"
                      placeholder="Tòa A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Số phòng
                    </label>
                    <Input
                      value={detail.roomNumber || ""}
                      onChange={(e) => {
                        const newDetails = [...details];
                        newDetails[index].roomNumber = e.target.value;
                        setDetails(newDetails);
                      }}
                      className="w-full"
                      placeholder="101"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Số giường
                    </label>
                    <NcInputNumber
                      defaultValue={detail.beds || beds}
                      onChange={(val) => {
                        const newDetails = [...details];
                        newDetails[index].beds = val;
                        setDetails(newDetails);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Số phòng tắm
                    </label>
                    <NcInputNumber
                      defaultValue={detail.bathrooms || bathrooms}
                      onChange={(val) => {
                        const newDetails = [...details];
                        newDetails[index].bathrooms = val;
                        setDetails(newDetails);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Tính năng an toàn
                  </label>
                  <textarea
                    value={detail.safetyFeatures || ""}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index].safetyFeatures = e.target.value;
                      setDetails(newDetails);
                    }}
                    rows={2}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100 resize-none"
                    placeholder="Có camera, hệ thống báo cháy..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Tiêu chuẩn vệ sinh
                  </label>
                  <textarea
                    value={detail.hygieneStandards || ""}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index].hygieneStandards = e.target.value;
                      setDetails(newDetails);
                    }}
                    rows={2}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100 resize-none"
                    placeholder="Vệ sinh tốt, khử trùng định kỳ..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDetails(details.filter((_, i) => i !== index))}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Xóa chi tiết này
                </button>
              </div>
            ))}
            <ButtonSecondary
              type="button"
              onClick={() => setDetails([...details, {
                buildingName: "",
                roomNumber: "",
                beds: beds,
                bathrooms: bathrooms,
                safetyFeatures: "",
                hygieneStandards: "",
              }])}
            >
              + Thêm chi tiết phòng
            </ButtonSecondary>
          </div>
        </div>

        {/* Amenities và Utilities */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Tiện ích & Dịch vụ
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Tiện ích (Amenities)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                {amenities.map((amenity) => (
                  <label key={amenity.amenityId} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={amenityIds.includes(amenity.amenityId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAmenityIds([...amenityIds, amenity.amenityId]);
                        } else {
                          setAmenityIds(amenityIds.filter(id => id !== amenity.amenityId));
                        }
                      }}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{amenity.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Dịch vụ (Utilities)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                {utilities.map((utility) => (
                  <label key={utility.utilityId} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={utilityIds.includes(utility.utilityId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUtilityIds([...utilityIds, utility.utilityId]);
                        } else {
                          setUtilityIds(utilityIds.filter(id => id !== utility.utilityId));
                        }
                      }}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{utility.name}</span>
                  </label>
                ))}
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
                  <ImageItem
                    key={i}
                    img={img}
                    index={i}
                    onRemove={() => removeImage(i)}
                  />
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


