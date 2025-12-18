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
          className="w-full h-40 object-cover rounded-xl border-2 border-neutral-200 dark:border-neutral-700 shadow-md group-hover:shadow-xl transition-all duration-200"
          onError={(e) => {
            setImageError(true);
          }}
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-md">
          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-110"
        title="Xóa ảnh"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
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
  const [resortUtilities, setResortUtilities] = useState<UtilityDTO[]>([]); // Utilities của resort được chọn
  const [originalCondotelUtilities, setOriginalCondotelUtilities] = useState<UtilityDTO[]>([]); // Utilities ban đầu từ condotel data

  // Upload
  const [imgUrl, setImgUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Không tìm thấy ID condotel");
        setLoading(false);
        return;
      }
      if (!user || user.roleName !== "Host") {
        navigate("/");
        return;
      }
      setLoading(true);
      setError("");
      try {
        // Load condotel data
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
        // Set resortId ngay lập tức để dropdown hiển thị đúng
        const initialResortId = data.resortId;
        if (initialResortId) {
          setResortId(initialResortId);
        }
        
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
        const existingUtilityIds = (data.utilities || []).map((u: any) => u.utilityId || u.UtilityId);
        setAmenityIds((data.amenities || []).map((a: any) => a.amenityId || a.AmenityId));
        setUtilityIds(existingUtilityIds);

        // Load options for dropdowns
        // Note: Không có API /api/host/utility để lấy tất cả utilities
        // Chỉ load amenities và resorts, utilities sẽ được load từ resort và condotel data
        const [resortsData, amenitiesData] = await Promise.all([
          resortAPI.getAll().catch(() => [] as ResortDTO[]),
          amenityAPI.getAll().catch(() => []),
        ]);
        
        // Đảm bảo resortId được set trước khi sắp xếp
        const currentResortId = initialResortId || data.resortId;
        
        // Đảm bảo resort hiện tại có trong danh sách
        // Nếu không có, load resort đó riêng và thêm vào
        if (currentResortId) {
          const hasCurrentResort = resortsData.some(r => r.resortId === currentResortId);
          if (!hasCurrentResort) {
            try {
              const currentResort = await resortAPI.getById(currentResortId);
              resortsData.unshift(currentResort); // Thêm vào đầu danh sách
            } catch (err) {
              console.error("Failed to load current resort:", err);
            }
          }
        }
        
        // Sắp xếp resorts: resort hiện tại lên đầu
        const sortedResorts = [...resortsData].sort((a, b) => {
          if (a.resortId === currentResortId) return -1;
          if (b.resortId === currentResortId) return 1;
          return 0;
        });
        setResorts(sortedResorts);
        
        // Đảm bảo resortId được set lại sau khi đã có danh sách resorts
        if (currentResortId) {
          setResortId(currentResortId);
        }
        
        setAmenities(amenitiesData);
        
        // Load utilities từ resort và condotel data
        // Kết hợp utilities từ resort và utilities đã chọn từ condotel
        const allUtilities: UtilityDTO[] = [];
        
        // 1. Load utilities của resort hiện tại nếu có
        if (data.resortId) {
          try {
            const resortUtils = await utilityAPI.getByResort(data.resortId);
            setResortUtilities(resortUtils);
            // Thêm utilities của resort vào danh sách
            resortUtils.forEach(util => {
              if (!allUtilities.some(u => u.utilityId === util.utilityId)) {
                allUtilities.push(util);
              }
            });
          } catch (err) {
            console.error("Failed to load resort utilities:", err);
          }
        }
        
        // 2. Thêm utilities đã được chọn từ condotel data (nếu chưa có trong danh sách)
        const condotelUtilities: UtilityDTO[] = [];
        if (data.utilities && Array.isArray(data.utilities)) {
          data.utilities.forEach((util: any) => {
            const utilityId = util.utilityId || util.UtilityId;
            const utilityName = util.name || util.Name || `Utility #${utilityId}`;
            const utilityDesc = util.description || util.Description;
            const utilityCategory = util.category || util.Category;
            
            const utility: UtilityDTO = {
              utilityId: utilityId,
              name: utilityName,
              description: utilityDesc,
              category: utilityCategory,
            };
            
            condotelUtilities.push(utility);
            
            if (!allUtilities.some(u => u.utilityId === utilityId)) {
              allUtilities.push(utility);
            }
          });
        }
        
        // Lưu utilities ban đầu từ condotel data để sử dụng khi đổi resort
        setOriginalCondotelUtilities(condotelUtilities);
        setUtilities(allUtilities);
      } catch (e: any) {
        const errorMsg = e?.response?.data?.message || e?.message || "Không thể tải condotel";
        setError(errorMsg);
        showErrorMessage("Tải condotel", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, navigate]);

  // Load utilities khi resortId thay đổi
  useEffect(() => {
    const loadResortUtilities = async () => {
      if (resortId) {
        try {
          console.log("🔄 Loading utilities for resort:", resortId);
          const resortUtils = await utilityAPI.getByResort(resortId);
          console.log("✅ Loaded resort utilities:", resortUtils.length, "utilities");
          setResortUtilities(resortUtils);
          
          // CHỈ hiển thị utilities của resort mới, không thêm utilities từ condotel ban đầu
          // Khi chọn resort mới, chỉ hiển thị utilities của resort đó
          setUtilities(resortUtils);
          console.log("✅ Updated utilities list:", resortUtils.length, "utilities (chỉ utilities của resort)");
          
          // CHỈ chọn utilities của resort mới
          const resortUtilityIds = resortUtils.map(u => u.utilityId);
          setUtilityIds(resortUtilityIds);
          console.log("✅ Updated utilityIds:", resortUtilityIds.length, "selected (chỉ utilities của resort)");
        } catch (err) {
          console.error("❌ Failed to load resort utilities:", err);
          setResortUtilities([]);
          setUtilities([]);
          setUtilityIds([]);
        }
      } else {
        console.log("⚠️ No resort selected, showing original utilities");
        setResortUtilities([]);
        // Nếu không có resort, chỉ hiển thị utilities đã chọn từ condotel data
        if (originalCondotelUtilities.length > 0) {
          setUtilities(originalCondotelUtilities);
          setUtilityIds(originalCondotelUtilities.map(u => u.utilityId));
        } else {
          // Nếu không có originalCondotelUtilities, xóa hết
          setUtilities([]);
          setUtilityIds([]);
        }
      }
    };
    
    // Chỉ load khi resortId thay đổi và đã có originalCondotelUtilities được set
    // Hoặc load ngay nếu resortId có giá trị
    if (resortId !== undefined) {
      loadResortUtilities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resortId]);


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
      showErrorMessage("Upload ảnh", err);
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

  // Validate prices
  const validatePrices = (): boolean => {
    for (let i = 0; i < prices.length; i++) {
      const price = prices[i];
      if (!price.startDate || !price.endDate) {
        continue; // Skip if dates are empty
      }

      const startDate = new Date(price.startDate);
      const endDate = new Date(price.endDate);

      if (startDate >= endDate) {
        setError(`Prices[${i}]: Ngày bắt đầu (${price.startDate}) phải nhỏ hơn ngày kết thúc (${price.endDate}).`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    
    if (!name.trim()) { setError("Vui lòng nhập tên condotel"); return; }
    if (pricePerNight <= 0) { setError("Giá mỗi đêm phải > 0"); return; }
    if (beds <= 0 || bathrooms <= 0) { setError("Số giường/phòng tắm phải > 0"); return; }
    
    // Validate prices
    if (prices.length > 0 && !validatePrices()) {
      return;
    }

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
  // Debug: Current form state (removed console.log for production)

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16 pt-8 bg-gradient-to-br from-neutral-50 via-white to-blue-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-900/20 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          <button
            onClick={() => navigate("/host-dashboard?tab=condotels")}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-neutral-900 dark:text-neutral-100 font-medium">Chỉnh sửa Condotel</span>
        </div>
        <div className="bg-gradient-to-r from-white to-blue-50/50 dark:from-neutral-800 dark:to-blue-900/20 rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Chỉnh sửa Condotel
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">Cập nhật thông tin căn hộ của bạn</p>
            </div>
            {status === "Active" ? (
              <span className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Còn phòng
              </span>
            ) : (
              <span className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-500/30 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Hết phòng
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border-l-4 border-red-500 dark:border-red-400 text-red-800 dark:text-red-200 rounded-xl shadow-lg shadow-red-500/10 whitespace-pre-line text-sm flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="flex-1">{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Resort Selection - Đẩy lên đầu */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              Chọn Resort
            </h2>
          </div>
          <div className="p-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                Resort <span className="text-red-500">*</span>
              </label>
              <select
                value={resortId !== undefined && resortId !== null ? String(resortId) : ""}
                onChange={(e) => setResortId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-3.5 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:text-neutral-100 transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md"
              >
                <option value="">-- Không chọn resort --</option>
                {resorts.map((resort) => (
                  <option key={resort.resortId} value={String(resort.resortId)}>
                    {resort.name}
                    {resort.address && ` - ${resort.address}`}
                    {resort.city && `, ${resort.city}`}
                  </option>
                ))}
              </select>
              {resortId !== undefined && resortId !== null && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Resort hiện tại: <span className="font-bold text-blue-600 dark:text-blue-400">{resorts.find(r => r.resortId === resortId)?.name || `Resort #${resortId}`}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              Thông tin cơ bản
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Tên condotel <span className="text-red-500">*</span>
              </label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
                className="w-full border-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                placeholder="Nhập tên condotel"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Mô tả
              </label>
              <textarea
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:text-neutral-100 resize-none transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600"
                placeholder="Mô tả chi tiết về căn hộ..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                Tình trạng phòng <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`relative flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    status === "Active"
                      ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 shadow-md shadow-green-500/20"
                      : "border-neutral-300 dark:border-neutral-600 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/10"
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
                  className={`relative flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    status === "Inactive"
                      ? "border-gray-500 bg-gradient-to-br from-gray-50 to-neutral-50 dark:from-gray-900/30 dark:to-neutral-900/20 shadow-md shadow-gray-500/20"
                      : "border-neutral-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50/50 dark:hover:bg-gray-900/10"
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
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-cyan-900/20 dark:to-teal-900/20">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
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
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Giá theo thời gian
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {prices.map((price, index) => {
              const startDate = price.startDate ? new Date(price.startDate) : null;
              const endDate = price.endDate ? new Date(price.endDate) : null;
              const hasDateError = !!(startDate && endDate && startDate >= endDate);
              
              return (
                <div key={index} className={`p-5 border-2 rounded-xl space-y-4 transition-all duration-200 ${
                  hasDateError 
                    ? "border-red-400 dark:border-red-600 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/20 shadow-md shadow-red-500/20" 
                    : "border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg"
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Ngày bắt đầu
                      </label>
                      <Input
                        type="date"
                        value={price.startDate || ""}
                        onChange={(e) => {
                          const newPrices = [...prices];
                          newPrices[index].startDate = e.target.value;
                          setPrices(newPrices);
                          setError(""); // Clear error when user edits
                        }}
                        className={`w-full ${hasDateError ? "border-red-500" : ""}`}
                      />
                      {hasDateError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          ⚠️ Ngày bắt đầu phải nhỏ hơn ngày kết thúc
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Ngày kết thúc
                      </label>
                      <Input
                        type="date"
                        value={price.endDate || ""}
                        onChange={(e) => {
                          const newPrices = [...prices];
                          newPrices[index].endDate = e.target.value;
                          setPrices(newPrices);
                          setError(""); // Clear error when user edits
                        }}
                        className={`w-full ${hasDateError ? "border-red-500" : ""}`}
                      />
                      {hasDateError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          ⚠️ Ngày kết thúc phải lớn hơn ngày bắt đầu
                        </p>
                      )}
                    </div>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Giá cơ bản (VNĐ) *
                    </label>
                    <Input
                      type="number"
                      value={price.basePrice || ""}
                      onChange={(e) => {
                        const newPrices = [...prices];
                        newPrices[index].basePrice = e.target.value ? Number(e.target.value) : 0;
                        setPrices(newPrices);
                      }}
                      className="w-full"
                      placeholder="Nhập giá (VNĐ)"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Loại giá
                    </label>
                    <select
                      value={price.priceType || "Thường"}
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
                      value={price.description || ""}
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
                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={async () => {
                      // Validate price trước khi lưu
                      if (!price.startDate || !price.endDate) {
                        setError("Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc");
                        return;
                      }
                      const startDate = new Date(price.startDate);
                      const endDate = new Date(price.endDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
                      
                      if (startDate >= endDate) {
                        setError("Ngày bắt đầu phải nhỏ hơn ngày kết thúc");
                        return;
                      }
                      
                      // Kiểm tra endDate không được ở quá khứ
                      if (endDate < today) {
                        setError("Ngày kết thúc không được ở quá khứ");
                        return;
                      }
                      
                      // Lưu ngay giá này vào backend (lưu toàn bộ condotel bao gồm giá này)
                      try {
                        setSaving(true);
                        setError("");
                        if (!id) return;
                        
                        // Validate price trước khi lưu
                        if (!price.startDate || !price.endDate) {
                          setError("Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc");
                          setSaving(false);
                          return;
                        }
                        const startDate = new Date(price.startDate);
                        const endDate = new Date(price.endDate);
                        if (startDate >= endDate) {
                          setError("Ngày bắt đầu phải nhỏ hơn ngày kết thúc");
                          setSaving(false);
                          return;
                        }
                        
                        const payload: CondotelDetailDTO = {
                          condotelId: Number(id),
                          hostId: user?.userId || 0,
                          resortId: resortId,
                          name: name.trim(),
                          description: description.trim() || undefined,
                          pricePerNight,
                          beds,
                          bathrooms,
                          status,
                          images: images.length ? images.map((i, idx) => ({ imageId: idx, imageUrl: i.imageUrl, caption: i.caption })) : undefined,
                          prices: prices.length > 0 ? prices : undefined, // Gửi tất cả giá
                          details: details.length > 0 ? details : undefined,
                        } as CondotelDetailDTO;

                        const updatePayload: any = {
                          ...payload,
                          amenityIds: amenityIds.length > 0 ? amenityIds : undefined,
                          utilityIds: utilityIds.length > 0 ? utilityIds : undefined,
                        };

                        await condotelAPI.update(Number(id), updatePayload);
                        toastSuccess("Đã lưu giá thành công!");
                        // Reload data để cập nhật priceId
                        const data = await condotelAPI.getByIdForHost(Number(id));
                        if (data.prices) {
                          setPrices(data.prices);
                        }
                      } catch (err: any) {
                        setError(err?.response?.data?.message || err.message || "Không thể lưu giá");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || hasDateError}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Lưu giá này
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrices(prices.filter((_, i) => i !== index))}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa giá này
                  </button>
                </div>
              </div>
              );
            })}
            <button
              type="button"
              onClick={() => setPrices([...prices, {
                priceId: 0,
                startDate: "",
                endDate: "",
                basePrice: 0,
                priceType: "Thường",
                description: "",
              }])}
              className="w-full px-5 py-3 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 hover:from-primary-100 hover:to-blue-100 dark:hover:from-primary-900/30 dark:hover:to-blue-900/30 border-2 border-dashed border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm giá mới
            </button>
          </div>
        </div>

        {/* Details với safetyFeatures và hygieneStandards */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              Chi tiết phòng
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {details.map((detail, index) => (
              <div key={index} className="p-5 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl space-y-4 bg-white/50 dark:bg-neutral-800/50 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg transition-all duration-200">
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
                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={async () => {
                      // Lưu ngay detail này vào backend (lưu toàn bộ condotel bao gồm detail này)
                      try {
                        setSaving(true);
                        setError("");
                        if (!id) return;
                        
                        const payload: CondotelDetailDTO = {
                          condotelId: Number(id),
                          hostId: user?.userId || 0,
                          resortId: resortId,
                          name: name.trim(),
                          description: description.trim() || undefined,
                          pricePerNight,
                          beds,
                          bathrooms,
                          status,
                          images: images.length ? images.map((i, idx) => ({ imageId: idx, imageUrl: i.imageUrl, caption: i.caption })) : undefined,
                          prices: prices.length > 0 ? prices : undefined,
                          details: details.length > 0 ? details : undefined, // Gửi tất cả details
                        } as CondotelDetailDTO;

                        const updatePayload: any = {
                          ...payload,
                          amenityIds: amenityIds.length > 0 ? amenityIds : undefined,
                          utilityIds: utilityIds.length > 0 ? utilityIds : undefined,
                        };

                        await condotelAPI.update(Number(id), updatePayload);
                        toastSuccess("Đã lưu chi tiết phòng thành công!");
                      } catch (err: any) {
                        setError(err?.response?.data?.message || err.message || "Không thể lưu chi tiết phòng");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Lưu chi tiết này
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetails(details.filter((_, i) => i !== index))}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa chi tiết này
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDetails([...details, {
                buildingName: "",
                roomNumber: "",
                beds: beds,
                bathrooms: bathrooms,
                safetyFeatures: "",
                hygieneStandards: "",
              }])}
              className="w-full px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 border-2 border-dashed border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm chi tiết phòng
            </button>
          </div>
        </div>

        {/* Amenities và Utilities */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-900/20 dark:to-green-900/20">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
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
                {resortId && resortUtilities.length > 0 && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    (Đã tự động chọn utilities của resort)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                {utilities.map((utility) => {
                  const isResortUtility = resortUtilities.some(ru => ru.utilityId === utility.utilityId);
                  return (
                    <label 
                      key={utility.utilityId} 
                      className={`flex items-center space-x-2 cursor-pointer p-2 rounded ${
                        isResortUtility ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
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
                      <span className={`text-sm ${isResortUtility ? "font-medium text-blue-700 dark:text-blue-300" : "text-neutral-700 dark:text-neutral-300"}`}>
                        {utility.name}
                        {isResortUtility && (
                          <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Resort)</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Hình ảnh */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-rose-50/50 to-pink-50/50 dark:from-rose-900/20 dark:to-pink-900/20">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Hình ảnh <span className="text-lg text-primary-600 dark:text-primary-400">({images.length})</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-6 border-t-2 border-neutral-200 dark:border-neutral-700">
                {images.map((img, i) => (
                  <div key={i} className="transform transition-all duration-200 hover:scale-105">
                    <ImageItem
                      img={img}
                      index={i}
                      onRemove={() => removeImage(i)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t-2 border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 rounded-2xl p-6 shadow-lg">
          <button
            type="button"
            onClick={() => navigate("/host-dashboard?tab=condotels")}
            className="px-8 py-3 bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-600 hover:from-neutral-200 hover:to-neutral-300 dark:hover:from-neutral-600 dark:hover:to-neutral-500 text-neutral-700 dark:text-neutral-200 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 via-blue-600 to-primary-600 hover:from-primary-700 hover:via-blue-700 hover:to-primary-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cập nhật Condotel
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PageEditCondotel;


