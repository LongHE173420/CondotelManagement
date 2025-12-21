import React, { FC } from "react";
import { CondotelDTO } from "api/condotel";
import { StarIcon, MapPinIcon, HomeIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import Badge from "shared/Badge/Badge";
import NcImage from "shared/NcImage/NcImage";

export interface CardCondotelFeaturedProps {
  className?: string;
  condotel: CondotelDTO;
  index?: number;
}

const CardCondotelFeatured: FC<CardCondotelFeaturedProps> = ({
  className = "",
  condotel,
  index,
}) => {
  return (
    <Link
      to={`/listing-detail/${condotel.condotelId}`}
      className={`nc-CardCondotelFeatured group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-100 dark:border-neutral-700 h-full ${className}`}
      data-nc-id="CardCondotelFeatured"
    >
      {/* Badge xếp hạng */}
      {index && (
        <div className="absolute top-4 left-4 z-20">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg backdrop-blur-sm
            ${index === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
              index === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
              'bg-gradient-to-br from-amber-600 to-amber-800'}
          `}>
            #{index}
          </div>
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden h-56 sm:h-64">
        <NcImage
          containerClassName="absolute inset-0"
          src={condotel.thumbnailUrl || ""}
          alt={condotel.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5 sm:p-6">
        {/* Name & Rating */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {condotel.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(condotel.reviewRate || 0)
                      ? "text-amber-500"
                      : i < (condotel.reviewRate || 0)
                      ? "text-amber-200"
                      : "text-neutral-300 dark:text-neutral-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {(condotel.reviewRate || 0).toFixed(1)}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              ({condotel.reviewCount || 0} đánh giá)
            </span>
          </div>
        </div>

        {/* Resort Name */}
        <div className="flex items-start gap-2 mb-4 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
          <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary-600 dark:text-primary-400" />
          <span>{condotel.resortName || "Resort"}</span>
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <HomeIcon className="w-4 h-4 text-primary-600" />
            <span className="font-medium">{condotel.beds || 1} phòng</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <WrenchScrewdriverIcon className="w-4 h-4 text-primary-600" />
            <span className="font-medium">{condotel.bathrooms || 1} phòng tắm</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ₫{(condotel.pricePerNight || 0).toLocaleString('vi-VN')}
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">/ đêm</p>
          </div>
          <div className="text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
            →
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CardCondotelFeatured;
