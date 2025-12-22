import React, { FC, useState } from "react";
import { Link } from "react-router-dom";
import StartRating from "components/StartRating/StartRating";
import BtnLikeIcon from "components/BtnLikeIcon/BtnLikeIcon";
import { CondotelDTO } from "api/condotel";
import { calculateFinalPrice } from "utils/priceCalculator";
import moment from "moment";

export interface CondotelCardProps {
  className?: string;
  data?: CondotelDTO;
  size?: "default" | "small";
}

// Mock data để hiển thị khi không có dữ liệu thực
const MOCK_CONDOTEL_DATA: CondotelDTO = {
  condotelId: "mock-1",
  name: "Best Western Cedars Boutique Hotel",
  pricePerNight: 26,
  beds: 10,
  bathrooms: 4,
  status: "active",
  thumbnailUrl: "https://images.unsplash.com/photo-1566665556112-31771c3b37c9?w=800&h=600&fit=crop",
  resortName: "1 Anzinger Court",
  activePromotion: {
    promotionId: "promo-1",
    name: "Discount",
    discountPercentage: 10,
    discountAmount: 0,
    startDate: moment().toISOString(),
    endDate: moment().add(30, 'days').toISOString(),
    status: "active",
    isActive: true,
  },
  activePrice: null,
  reviewRate: 4.8,
  reviewCount: 28,
} as any;

const CondotelCard: FC<CondotelCardProps> = ({
  size = "default",
  className = "",
  data,
}) => {
  // Dùng mock data nếu không có dữ liệu thực
  const cardData = data || MOCK_CONDOTEL_DATA;
  
  const {
    condotelId,
    name,
    pricePerNight,
    beds,
    bathrooms,
    status,
    thumbnailUrl,
    resortName,
    activePromotion,
    activePrice,
    reviewRate = 4.8,
    reviewCount = 28,
  } = cardData;

  // State for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);



  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Kiểm tra promotion có đang active tại thời điểm hiện tại không
  const isPromotionCurrentlyActive = (): boolean => {
    if (!activePromotion) {
      return false;
    }

    // CHỈ kiểm tra status field - bỏ hoàn toàn isActive
    const hasActiveStatus = activePromotion.status === "Active" || activePromotion.status === "active";
    const hasInactiveStatus = activePromotion.status === "Inactive" || activePromotion.status === "inactive";
    
    // Nếu có status Inactive, bỏ qua
    if (hasInactiveStatus) {
      return false;
    }
    
    // Nếu không có status field (null/undefined), coi như không valid
    if (!hasActiveStatus && !hasInactiveStatus) {
      return false;
    }

    // Kiểm tra có discount không (phải có discountPercentage hoặc discountAmount > 0)
    const hasDiscount = (activePromotion.discountPercentage !== undefined && 
                        activePromotion.discountPercentage !== null && 
                        activePromotion.discountPercentage > 0) ||
                       (activePromotion.discountAmount !== undefined && 
                        activePromotion.discountAmount !== null && 
                        activePromotion.discountAmount > 0);
    
    if (!hasDiscount) {
      return false;
    }

    // Nếu không có startDate và endDate, nhưng có discount và status Active, cho phép
    if (!activePromotion.startDate || !activePromotion.endDate) {
      return hasActiveStatus;
    }

    // Kiểm tra thời gian
    const promoStart = moment(activePromotion.startDate);
    const promoEnd = moment(activePromotion.endDate);
    const now = moment();
    
    // Kiểm tra thời gian hợp lệ
    const isWithinDateRange = now.isSameOrAfter(promoStart, 'day') && now.isSameOrBefore(promoEnd, 'day');
    
    // Status Active VÀ trong thời gian hợp lệ
    if (hasActiveStatus && isWithinDateRange) {
      return true;
    }
    
    return false;
  };

  // Tính giá cuối cùng: basePrice (từ activePrice hoặc pricePerNight) + promotion
  // Nếu backend đã trả về activePromotion và có discount, luôn sử dụng nó
  const isPromoActive = isPromotionCurrentlyActive();
  // Luôn sử dụng activePromotion nếu có discount (backend đã xác nhận)
  const promotionToUse = activePromotion && isPromoActive ? activePromotion : null;
  
  const { basePrice, finalPrice, discountAmount } = calculateFinalPrice(
    pricePerNight,
    activePrice,
    promotionToUse
  );

  const hasDiscount = discountAmount > 0;

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full aspect-w-4 aspect-h-3 overflow-hidden rounded-t-2xl">
        <img
          src={thumbnailUrl || "/images/placeholders/placeholder.jpg"}
          alt={name}
          className="w-full h-full object-cover"
        />
        {/* Promotion Badge - chỉ hiển thị khi promotion đang active */}
        {isPromotionCurrentlyActive() && (
          <div className="absolute left-3 top-3 z-[1]">
            <span className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
              {activePromotion!.discountPercentage 
                ? `-${activePromotion!.discountPercentage}% today`
                : activePromotion!.discountAmount
                ? `-${formatPrice(activePromotion!.discountAmount)}`
                : "Khuyến mãi"}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    return (
      <div className={size === "default" ? "p-4 space-y-4" : "p-3 space-y-2"}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2
              className={`font-semibold ${size === "default" ? "text-lg" : "text-base"}`}
            >
              <span className="line-clamp-1">{name}</span>
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {beds} giường · {bathrooms} phòng tắm
            </span>
          </div>
          {resortName && (
            <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-sm space-x-2">
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="line-clamp-1">{resortName}</span>
            </div>
          )}
        </div>
        <div className="w-14 border-b border-neutral-100 dark:border-neutral-800"></div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              {/* Hiển thị cả giá gốc (gạch ngang) và giá sau giảm nếu có promotion */}
              {hasDiscount ? (
                <>
                  <span className="text-base font-semibold text-red-600 dark:text-red-400">
                    {formatPrice(finalPrice)}
                    {size === "default" && (
                      <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
                        /đêm
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">
                    {formatPrice(basePrice)}
                  </span>
                </>
              ) : (
                <span className="text-base font-semibold">
                  {formatPrice(basePrice)}
                  {size === "default" && (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
                      /đêm
                    </span>
                  )}
                </span>
              )}
            </div>
            <StartRating reviewCount={reviewCount} point={reviewRate} />
          </div>
          <BtnLikeIcon isLiked={false} />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`nc-CondotelCard group relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden will-change-transform hover:shadow-xl transition-shadow w-full flex flex-col ${className}`}
      data-nc-id="CondotelCard"
    >
      {renderSliderGallery()}
      <Link to={`/listing-stay-detail/${condotelId}`} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col justify-between">
          {renderContent()}
        </div>
      </Link>
    </div>
  );
};

export default CondotelCard;

