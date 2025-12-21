import React, { FC } from "react";
import { AuthorType } from "data/types";
import { StarIcon, BuildingOfficeIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import Avatar from "shared/Avatar/Avatar";
import Badge from "shared/Badge/Badge";

export interface CardHostCondotelProps {
  className?: string;
  author: AuthorType;
  index?: number;
}

const CardHostCondotel: FC<CardHostCondotelProps> = ({
  className = "",
  author,
  index,
}) => {
  const { displayName, href = "/", avatar, starRating, count, desc } = author;
  
  return (
    <Link
      to={href}
      className={`nc-CardHostCondotel relative flex flex-col p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 group ${className}`}
      data-nc-id="CardHostCondotel"
    >
      {/* Badge xếp hạng */}
      {index && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg
            ${index === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
              index === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
              'bg-gradient-to-br from-amber-600 to-amber-800'}
          `}>
            #{index}
          </div>
        </div>
      )}

      {/* Header - Avatar */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <Avatar
            sizeClass="w-16 h-16 text-2xl"
            radius="rounded-xl"
            imgUrl={avatar}
            userName={displayName}
          />
          <div className="absolute bottom-0 right-0">
            <CheckCircleIcon className="w-5 h-5 text-green-500 bg-white dark:bg-neutral-800 rounded-full" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white line-clamp-1">
            {displayName}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(starRating || 0)
                      ? "text-amber-400"
                      : i < (starRating || 0)
                      ? "text-amber-200"
                      : "text-neutral-300 dark:text-neutral-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {(starRating || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Description - Reviews & Condotels */}
      <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
        {desc || "Host chuyên nghiệp"}
      </div>

      {/* Condotel Count */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
        <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            Condotels Hoạt Động
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {count || 0}
          </div>
        </div>
      </div>

      {/* Rating Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full border border-amber-100 dark:border-amber-800/50">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            Đánh giá cao
          </span>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          Xem chi tiết →
        </div>
      </div>
    </Link>
  );
};

export default CardHostCondotel;
