import React, { FC, useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useAddCondotel } from "./_context";
import { useAuth } from "contexts/AuthContext";
import condotelAPI, { CreateCondotelDTO } from "api/condotel";
import locationAPI from "api/location";
import uploadAPI from "api/upload";
import Input from "shared/Input/Input";
import Select from "shared/Select/Select";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import FormItem from "./FormItem";
import NcInputNumber from "components/NcInputNumber/NcInputNumber";

interface ImageDTO {
  imageUrl: string;
  caption?: string;
}

interface DetailDTO {
  buildingName?: string;
  roomNumber?: string;
}

const PageAddListingSimple: FC = () => {
  const { formData, setFormData, resetForm } = useAddCondotel();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Basic Info
  const [name, setName] = useState(formData.name || "");
  const [propertyType, setPropertyType] = useState(formData.propertyType || "Hotel");
  const [rentalForm, setRentalForm] = useState(formData.rentalForm || "Entire place");
  const [description, setDescription] = useState(formData.description || "");
  const [status, setStatus] = useState(formData.status || "Pending");

  // Location
  const [address, setAddress] = useState(formData.address || "");
  const [city, setCity] = useState(formData.city || "");
  const [country, setCountry] = useState(formData.country || "Viet Nam");
  const [postalCode, setPostalCode] = useState(formData.postalCode || "");
  const [locationName, setLocationName] = useState(formData.locationName || "");

  // Details
  const [beds, setBeds] = useState<number>(formData.beds ? Number(formData.beds) : 1);
  const [bathrooms, setBathrooms] = useState<number>(formData.bathrooms ? Number(formData.bathrooms) : 1);
  const [pricePerNight, setPricePerNight] = useState<number>(formData.pricePerNight ? Number(formData.pricePerNight) : 0);

  // Amenities & Utilities
  const demoAmenities = [
    { amenityId: 1, name: "Pool" },
    { amenityId: 2, name: "Wifi" },
    { amenityId: 3, name: "Breakfast" },
  ];
  const demoUtilities = [
    { utilityId: 10, name: "Parking" },
    { utilityId: 11, name: "Gym" },
  ];
  const [amenityIds, setAmenityIds] = useState<number[]>(formData.amenityIds || []);
  const [utilityIds, setUtilityIds] = useState<number[]>(formData.utilityIds || []);

  // Images
  const [images, setImages] = useState<ImageDTO[]>(formData.images || []);
  const [imgUrl, setImgUrl] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Details
  const [details, setDetails] = useState<DetailDTO[]>(formData.details || []);
  const [buildingName, setBuildingName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync formData
  // Check if user is Host
  useEffect(() => {
    if (!user || user.roleName !== "Host") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      name,
      propertyType,
      rentalForm,
      description,
      status,
      address,
      city,
      country,
      postalCode,
      locationName,
      beds,
      bathrooms,
      pricePerNight,
      amenityIds,
      utilityIds,
      images,
      details,
    }));
  }, [
    name,
    propertyType,
    rentalForm,
    description,
    status,
    address,
    city,
    country,
    postalCode,
    locationName,
    beds,
    bathrooms,
    pricePerNight,
    amenityIds,
    utilityIds,
    images,
    details,
    setFormData,
  ]);

  const handleAddImage = () => {
    if (imgUrl.trim()) {
      setImages((arr: ImageDTO[]) => [...arr, { imageUrl: imgUrl.trim() }]);
      setImgUrl("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        setError(`File ${file.name} không phải là ảnh hợp lệ!`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} quá lớn (tối đa 10MB)!`);
        return;
      }
    }

    setError("");
    setUploadingImages(true);
    
    // Upload tất cả files song song
    const uploadPromises = fileArray.map(async (file): Promise<ImageDTO | null> => {
      try {
        // Upload ảnh lên server
        const response = await uploadAPI.uploadImage(file);
        
        if (response && response.imageUrl) {
          return { imageUrl: response.imageUrl, caption: file.name } as ImageDTO;
        } else {
          throw new Error("Không nhận được URL ảnh từ server");
        }
      } catch (err: any) {
        console.error("Upload image error:", err);
        setError((prev) => 
          prev ? `${prev}\n${file.name}: ${err.response?.data?.message || err.message}` 
               : `Không thể upload ảnh ${file.name}: ${err.response?.data?.message || err.message}`
        );
        return null;
      }
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    
    // Add successfully uploaded images
    const successfulUploads = uploadResults.filter((result): result is ImageDTO => {
      return result !== null && result !== undefined;
    });
    if (successfulUploads.length > 0) {
      setImages((arr: ImageDTO[]) => [...arr, ...successfulUploads]);
    }

    setUploadingImages(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((arr: ImageDTO[]) => arr.filter((_, i) => i !== index));
  };

  const handleAddDetail = () => {
    if (buildingName.trim() || roomNumber.trim()) {
      setDetails((arr: DetailDTO[]) => [
        ...arr,
        { buildingName: buildingName.trim(), roomNumber: roomNumber.trim() },
      ]);
      setBuildingName("");
      setRoomNumber("");
    }
  };

  const handleRemoveDetail = (index: number) => {
    setDetails((arr: DetailDTO[]) => arr.filter((_, i) => i !== index));
  };

  const handleToggleAmenity = (id: number) => {
    setAmenityIds((ids: number[]) =>
      ids.includes(id) ? ids.filter((i: number) => i !== id) : [...ids, id]
    );
  };

  const handleToggleUtility = (id: number) => {
    setUtilityIds((ids: number[]) =>
      ids.includes(id) ? ids.filter((i: number) => i !== id) : [...ids, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      alert("Bạn cần đăng nhập để thêm condotel!");
      return;
    }

    // Validation
    if (!name.trim()) {
      setError("Vui lòng nhập tên condotel!");
      return;
    }

    if (!address.trim() || !city.trim()) {
      setError("Vui lòng nhập địa chỉ đầy đủ!");
      return;
    }

    if (!pricePerNight || pricePerNight <= 0) {
      setError("Vui lòng nhập giá mỗi đêm hợp lệ!");
      return;
    }

    if (!beds || beds <= 0) {
      setError("Vui lòng nhập số giường!");
      return;
    }

    if (!bathrooms || bathrooms <= 0) {
      setError("Vui lòng nhập số phòng tắm!");
      return;
    }

    setLoading(true);
    try {
      // Create location first
      let locationId: number | undefined = formData.locationId as number | undefined;
      
      if (!locationId) {
        const location = await locationAPI.create({
          locationName: locationName || name,
          address,
          city,
          country,
          postalCode,
        });
        locationId = location.locationId;
      }

      // Build payload
      const payload: CreateCondotelDTO = {
        hostId: user.userId,
        name: name.trim(),
        pricePerNight: Number(pricePerNight),
        beds: Number(beds),
        bathrooms: Number(bathrooms),
        status: status,
        ...(description.trim() && { description: description.trim() }),
        ...(images.length > 0 && { images }),
        ...(details.length > 0 && { details }),
        ...(amenityIds.length > 0 && { amenityIds: amenityIds.map((id) => Number(id)) }),
        ...(utilityIds.length > 0 && { utilityIds: utilityIds.map((id) => Number(id)) }),
      };

      console.log("📤 CONDOTEL CREATE PAYLOAD:", payload);

      await condotelAPI.create(payload);
      console.log("✅ Condotel created successfully");

      alert("Tạo condotel thành công!");
      resetForm();
      
      setTimeout(() => {
        navigate("/host-dashboard");
      }, 500);
    } catch (err: any) {
      console.error("❌ Failed to create condotel:", err);
      let errorMessage = "Không thể tạo condotel. Vui lòng thử lại!";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorList = Object.entries(errors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
            const messageList = Array.isArray(messages) ? messages.join(", ") : messages;
            return `${fieldName}: ${messageList}`;
          })
          .join("\n");
        errorMessage = `Lỗi validation:\n${errorList}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nc-PageAddListingSimple">
      <Helmet>
        <title>Thêm Condotel || Booking React Template</title>
      </Helmet>

      <div className="container py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Thêm Condotel mới</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>

              <FormItem label="Tên condotel *">
                <Input
                  placeholder="Nhập tên condotel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormItem>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem label="Loại property">
                  <Select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                    <option value="Hotel">Hotel</option>
                    <option value="Cottage">Cottage</option>
                    <option value="Villa">Villa</option>
                    <option value="Cabin">Cabin</option>
                    <option value="Farm stay">Farm stay</option>
                    <option value="Houseboat">Houseboat</option>
                    <option value="Lighthouse">Lighthouse</option>
                  </Select>
                </FormItem>

                <FormItem label="Hình thức cho thuê">
                  <Select value={rentalForm} onChange={(e) => setRentalForm(e.target.value)}>
                    <option value="Entire place">Entire place</option>
                    <option value="Private room">Private room</option>
                    <option value="Share room">Share room</option>
                  </Select>
                </FormItem>
              </div>

              <FormItem label="Mô tả">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                  placeholder="Nhập mô tả về condotel..."
                />
              </FormItem>

              <FormItem label="Trạng thái">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </Select>
              </FormItem>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold mb-4">Địa chỉ</h2>

              <FormItem label="Quốc gia">
                <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="Viet Nam">Viet Nam</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Singapore">Singapore</option>
                </Select>
              </FormItem>

              <FormItem label="Địa chỉ đường/phố *">
                <Input
                  placeholder="Nhập địa chỉ"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </FormItem>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem label="Thành phố *">
                  <Input
                    placeholder="Nhập thành phố"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </FormItem>

                <FormItem label="Mã bưu điện">
                  <Input
                    placeholder="Nhập mã bưu điện"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </FormItem>
              </div>

              <FormItem label="Tên địa điểm (optional)">
                <Input
                  placeholder="Tên địa điểm"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </FormItem>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold mb-4">Chi tiết</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormItem label="Số giường *">
                  <NcInputNumber
                    defaultValue={beds}
                    onChange={(v: number) => setBeds(v)}
                    min={1}
                  />
                </FormItem>

                <FormItem label="Số phòng tắm *">
                  <NcInputNumber
                    defaultValue={bathrooms}
                    onChange={(v: number) => setBathrooms(v)}
                    min={1}
                  />
                </FormItem>

                <FormItem label="Giá mỗi đêm (VNĐ) *">
                  <Input
                    type="number"
                    placeholder="0"
                    value={pricePerNight || ""}
                    onChange={(e) => setPricePerNight(Number(e.target.value))}
                    required
                    min={0}
                  />
                </FormItem>
              </div>
            </div>

            {/* Amenities & Utilities */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold mb-4">Tiện ích & Tiện nghi</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Tiện ích</label>
                  <div className="space-y-2">
                    {demoAmenities.map((a) => (
                      <label key={a.amenityId} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={amenityIds.includes(a.amenityId)}
                          onChange={() => handleToggleAmenity(a.amenityId)}
                          className="rounded border-neutral-300 text-primary-600"
                        />
                        <span>{a.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tiện nghi</label>
                  <div className="space-y-2">
                    {demoUtilities.map((u) => (
                      <label key={u.utilityId} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={utilityIds.includes(u.utilityId)}
                          onChange={() => handleToggleUtility(u.utilityId)}
                          className="rounded border-neutral-300 text-primary-600"
                        />
                        <span>{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold mb-4">Hình ảnh</h2>

              {/* Upload Files */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Upload ảnh từ máy tính *
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploadingImages}
                    className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      file:cursor-pointer
                      cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadingImages && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Có thể chọn nhiều ảnh. Tối đa 10MB mỗi ảnh. {uploadingImages && "(Đang upload...)"}
                </p>
              </div>

              {/* Or Add URL */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Hoặc nhập URL hình ảnh
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập URL hình ảnh"
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                    className="flex-1"
                  />
                  <ButtonSecondary type="button" onClick={handleAddImage}>
                    Thêm URL
                  </ButtonSecondary>
                </div>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Danh sách ảnh đã thêm ({images.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.imageUrl}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-neutral-200 dark:border-neutral-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200?text=Image+Error";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Xóa ảnh"
                        >
                          ×
                        </button>
                        {img.caption && (
                          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 truncate">
                            {img.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {images.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg">
                  <svg
                    className="mx-auto h-12 w-12 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Chưa có ảnh nào. Hãy upload ảnh hoặc thêm URL.
                  </p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold mb-4">Chi tiết phòng</h2>

              <div className="flex gap-2">
                <Input
                  placeholder="Tên tòa nhà"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                />
                <Input
                  placeholder="Số phòng"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
                <ButtonSecondary type="button" onClick={handleAddDetail}>
                  Thêm
                </ButtonSecondary>
              </div>

              {details.length > 0 && (
                <ul className="space-y-2">
                  {details.map((detail, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-2 bg-neutral-100 dark:bg-neutral-700 rounded"
                    >
                      <span>
                        {detail.buildingName} - {detail.roomNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDetail(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <ButtonSecondary
                type="button"
                onClick={() => navigate("/host-dashboard")}
              >
                Hủy
              </ButtonSecondary>
              <ButtonPrimary type="submit" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo Condotel"}
              </ButtonPrimary>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PageAddListingSimple;

