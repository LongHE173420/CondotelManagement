import CardCondotelFeatured from "components/CardCondotelFeatured/CardCondotelFeatured";
import Heading from "components/Heading/Heading";
import { CondotelDTO } from "api/condotel";
import React, { FC } from "react";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/solid";

export interface SectionFeaturedCondotelsProps {
  className?: string;
  condotels?: CondotelDTO[];
  gridClassName?: string;
}

const SectionFeaturedCondotels: FC<SectionFeaturedCondotelsProps> = ({
  className = "",
  condotels = [],
  gridClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}) => {
  return (
    <div
      className={`nc-SectionFeaturedCondotels relative ${className}`}
      data-nc-id="SectionFeaturedCondotels"
    >
      {/* Header Section */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-0">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full">
            <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              ⭐ CONDOTEL NỘI BẬT
            </span>
          </div>

          <Heading
            isCenter
            desc="Những căn condotel tốt nhất được bình chọn cao từ khách hàng - Chất lượng, tiện nghi, và giá tối ưu"
          >
            Condotel Nổi Bật Nhất
          </Heading>
        </div>

        {/* Content Grid */}
        {condotels.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-neutral-400 dark:text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12a9 9 0 010-18 9 9 0 010 18zm0 0a9 9 0 0018 0 9 9 0 00-18 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">
              Đang tải danh sách condotel nổi bật...
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 md:gap-8 ${gridClassName}`}>
            {condotels.map((condotel, index) => (
              <CardCondotelFeatured
                key={condotel.condotelId}
                condotel={condotel}
                index={index < 3 ? index + 1 : undefined}
              />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 px-6 py-12 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-3xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Khám Phá Thêm Condotel
              </h3>
              <p className="text-purple-100 text-lg">
                Hàng nghìn căn condotel chất lượng cao đang chờ bạn
              </p>
            </div>
            <ButtonPrimary
              href="/listing-stay"
              className="!bg-white !text-purple-600 hover:!bg-neutral-100 whitespace-nowrap"
            >
              <span className="flex items-center gap-2">
                Xem Tất Cả
                <ArrowRightIcon className="w-5 h-5" />
              </span>
            </ButtonPrimary>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <ButtonSecondary href="/listing-stay" className="!py-3">
            🔍 Tìm Condotel Phù Hợp
          </ButtonSecondary>
          <ButtonSecondary href="/become-a-host" className="!py-3">
            🏢 Đăng Ký Condotel
          </ButtonSecondary>
        </div>
      </div>
    </div>
  );
};

export default SectionFeaturedCondotels;
