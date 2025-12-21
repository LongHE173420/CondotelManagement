import StayCard from "components/StayCard/StayCard";
import { DEMO_STAY_LISTINGS } from "data/listings";
import React, { FC } from "react";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import CommonLayout from "./CommonLayout";
import { useAddCondotel } from "./_context";
import { useAuth } from "contexts/AuthContext";
import condotelAPI, { CreateCondotelDTO } from "api/condotel";

export interface PageAddListing10Props {}

const PageAddListing10: FC<PageAddListing10Props> = () => {
  const { formData, resetForm } = useAddCondotel();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handlePublish = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập để thêm condotel!");
      return;
    }

    if (!formData || Object.keys(formData).length === 0) {
      alert("Không có dữ liệu để đăng! Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    try {
      const { locationId, ...condotelPayload } = formData;
      
      // Validate required fields trước khi build payload
      if (!condotelPayload.name || !condotelPayload.name.toString().trim()) {
        alert("Vui lòng nhập tên condotel!");
        setLoading(false);
        return;
      }

      if (!condotelPayload.pricePerNight || Number(condotelPayload.pricePerNight) <= 0) {
        alert("Vui lòng nhập giá mỗi đêm hợp lệ (lớn hơn 0)!");
        setLoading(false);
        return;
      }

      if (!condotelPayload.beds || Number(condotelPayload.beds) <= 0) {
        alert("Vui lòng nhập số giường (lớn hơn 0)!");
        setLoading(false);
        return;
      }

      if (!condotelPayload.bathrooms || Number(condotelPayload.bathrooms) <= 0) {
        alert("Vui lòng nhập số phòng tắm (lớn hơn 0)!");
        setLoading(false);
        return;
      }

      if (!condotelPayload.images || !Array.isArray(condotelPayload.images) || condotelPayload.images.length < 3) {
        alert("Vui lòng thêm ít nhất 3 hình ảnh cho condotel!");
        setLoading(false);
        return;
      }

      // Build payload đúng kiểu CreateCondotelDTO
      // Lưu ý: hostId không cần gửi (backend sẽ tự lấy từ JWT token)
      const payload: CreateCondotelDTO = {
        name: String(condotelPayload.name).trim(),
        pricePerNight: Number(condotelPayload.pricePerNight),
        beds: Number(condotelPayload.beds),
        bathrooms: Number(condotelPayload.bathrooms),
        status: String(condotelPayload.status || "Pending"),
        ...(condotelPayload.description && { description: String(condotelPayload.description).trim() }),
        ...(condotelPayload.images && Array.isArray(condotelPayload.images) && condotelPayload.images.length > 0 && { 
          images: condotelPayload.images.map((img: any) => ({
            imageUrl: img.imageUrl || img.ImageUrl,
            caption: img.caption || img.Caption,
          }))
        }),
        ...(condotelPayload.prices && Array.isArray(condotelPayload.prices) && condotelPayload.prices.length > 0 && { 
          prices: condotelPayload.prices.map((p: any) => ({
            startDate: p.startDate || p.StartDate,
            endDate: p.endDate || p.EndDate,
            basePrice: p.basePrice || p.BasePrice,
            priceType: p.priceType || p.PriceType,
            description: p.description || p.Description || "", // Required trong backend
          }))
        }),
        ...(condotelPayload.details && Array.isArray(condotelPayload.details) && condotelPayload.details.length > 0 && { 
          details: condotelPayload.details.map((d: any) => ({
            buildingName: d.buildingName || d.BuildingName,
            roomNumber: d.roomNumber || d.RoomNumber,
            beds: d.beds !== undefined ? d.beds : d.Beds,
            bathrooms: d.bathrooms !== undefined ? d.bathrooms : d.Bathrooms,
            safetyFeatures: d.safetyFeatures || d.SafetyFeatures,
            hygieneStandards: d.hygieneStandards || d.HygieneStandards,
          }))
        }),
        ...(condotelPayload.amenityIds && Array.isArray(condotelPayload.amenityIds) && condotelPayload.amenityIds.length > 0 && { amenityIds: condotelPayload.amenityIds.map(id => Number(id)) }),
        ...(condotelPayload.utilityIds && Array.isArray(condotelPayload.utilityIds) && condotelPayload.utilityIds.length > 0 && { utilityIds: condotelPayload.utilityIds.map(id => Number(id)) }),
        ...(condotelPayload.resortId && { resortId: Number(condotelPayload.resortId) }),
      };
      
      const created = await condotelAPI.create(payload);
      
      alert("Tạo condotel thành công!");
      resetForm();
      
      // Use navigate thay vì window.location.href
      setTimeout(() => {
        window.location.href = "/host-dashboard";
      }, 500);
    } catch (err: any) {
      
      let errorMessage = "Không thể tạo condotel. Vui lòng thử lại!";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Handle validation errors
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
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonLayout
      nextBtnText="Publish listing"
      index="10"
      backtHref="/add-listing-9"
      nextHref="/"
    >
      <>
        <div>
          <h2 className="text-2xl font-semibold">Congratulations 🎉</h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            Excellent, congratulations on completing the listing, it is waiting
            to be reviewed for publication
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div>
          <h3 className="text-lg font-semibold">This is your listing</h3>
          <div className="max-w-xs">
            <StayCard
              className="mt-8"
              data={{ ...DEMO_STAY_LISTINGS[0], reviewStart: 0 }}
            />
          </div>
          <div className="flex items-center space-x-5 mt-8">
            <ButtonSecondary href="/add-listing-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="ml-3">Edit</span>
            </ButtonSecondary>
            <ButtonPrimary onClick={handlePublish} disabled={loading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="ml-3">Publish listing</span>
            </ButtonPrimary>
          </div>
        </div>
      </>
    </CommonLayout>
  );
};

export default PageAddListing10;
