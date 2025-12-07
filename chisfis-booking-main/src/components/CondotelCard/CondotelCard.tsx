import React, { FC } from "react";
import { Link } from "react-router-dom";
import StartRating from "components/StartRating/StartRating";
import BtnLikeIcon from "components/BtnLikeIcon/BtnLikeIcon";
import { CondotelDTO } from "api/condotel";

export interface CondotelCardProps {
  className?: string;
  data: CondotelDTO;
  size?: "default" | "small";
}

const CondotelCard: FC<CondotelCardProps> = ({
  size = "default",
  className = "",
  data,
}) => {
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
  } = data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Tính giá sau khi giảm giá (nếu có promotion)
  const calculateDiscountedPrice = () => {
    if (!activePromotion) return pricePerNight;
    
    if (activePromotion.discountPercentage) {
      // Giảm theo phần trăm
      return pricePerNight * (1 - activePromotion.discountPercentage / 100);
    } else if (activePromotion.discountAmount) {
      // Giảm theo số tiền cố định
      return Math.max(0, pricePerNight - activePromotion.discountAmount);
    }
    
    return pricePerNight;
  };

  const discountedPrice = calculateDiscountedPrice();
  const hasDiscount = activePromotion && discountedPrice < pricePerNight;

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full aspect-w-4 aspect-h-3 overflow-hidden rounded-t-2xl">
        <img
          src={thumbnailUrl || "/images/placeholders/placeholder.jpg"}
          alt={name}
          className="w-full h-full object-cover"
        />
        <BtnLikeIcon isLiked={false} className="absolute right-3 top-3 z-[1]" />
        {/* Promotion Badge */}
        {activePromotion && (
          <div className="absolute left-3 top-3 z-[1]">
            <span className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
              {activePromotion.discountPercentage 
                ? `-${activePromotion.discountPercentage}%`
                : activePromotion.discountAmount
                ? `-${formatPrice(activePromotion.discountAmount)}`
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
          <div className="flex items-center gap-2">
            {status && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                  status === "Available" || status === "Active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {status === "Available" || status === "Active" ? "Còn phòng" : "Hết phòng"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              {hasDiscount ? (
                <>
                  <span className="text-base font-semibold text-red-600 dark:text-red-400">
                    {formatPrice(discountedPrice)}
                    {size === "default" && (
                      <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
                        /đêm
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">
                    {formatPrice(pricePerNight)}
                  </span>
                </>
              ) : (
                <span className="text-base font-semibold">
                  {formatPrice(pricePerNight)}
                  {size === "default" && (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
                      /đêm
                    </span>
                  )}
                </span>
              )}
            </div>
            <StartRating reviewCount={12} point={4.8} />
          </div>
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

