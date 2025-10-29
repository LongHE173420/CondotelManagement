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
  } = data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderSliderGallery = () => {
    return (
      <div className="relative w-full aspect-w-4 aspect-h-3 overflow-hidden rounded-t-2xl">
        <img
          src={thumbnailUrl || "/images/placeholders/placeholder.jpg"}
          alt={name}
          className="w-full h-full object-cover"
        />
        <BtnLikeIcon isLiked={false} className="absolute right-3 top-3 z-[1]" />
      </div>
    );
  };

  const renderContent = () => {
    return (
      <div className={size === "default" ? "p-4 space-y-4" : "p-3 space-y-2"}>
        <div className="space-y-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Condotel · {beds} beds · {bathrooms} bathrooms
          </span>
          <div className="flex items-center space-x-2">
            {status === "Available" && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Available
              </span>
            )}
            <h2
              className={`font-medium capitalize ${
                size === "default" ? "text-lg" : "text-base"
              }`}
            >
              <span className="line-clamp-1">{name}</span>
            </h2>
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
          <span className="text-base font-semibold">
            {formatPrice(pricePerNight)}
            {size === "default" && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
                /night
              </span>
            )}
          </span>
          <StartRating reviewCount={12} point={4.8} />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`nc-CondotelCard group relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden will-change-transform hover:shadow-xl transition-shadow ${className}`}
      data-nc-id="CondotelCard"
    >
      {renderSliderGallery()}
      <Link to={`/listing-stay-detail/${condotelId}`}>
        {renderContent()}
      </Link>
    </div>
  );
};

export default CondotelCard;

