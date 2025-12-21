import React, { FC } from "react";
import Heading from "components/Heading/Heading";

export interface WhyChooseFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface SectionWhyChooseCondotelProps {
  className?: string;
  gridClassName?: string;
}

const FEATURES: WhyChooseFeature[] = [
  {
    id: "1",
    icon: "🏢",
    title: "Căn hộ cao cấp",
    description: "Các căn hộ được thiết kế hiện đại với đầy đủ tiện nghi",
  },
  {
    id: "2",
    icon: "🌆",
    title: "Vị trí đắc địa",
    description: "Nằm tại những vị trí trung tâm, gần các điểm du lịch nổi tiếng",
  },
  {
    id: "3",
    icon: "🏊",
    title: "Tiện ích toàn diện",
    description: "Hồ bơi, gym, nhà hàng và các dịch vụ cao cấp",
  },
  {
    id: "4",
    icon: "💼",
    title: "Quản lý chuyên nghiệp",
    description: "Đội ngũ quản lý 24/7 đảm bảo chất lượng dịch vụ",
  },
  {
    id: "5",
    icon: "⭐",
    title: "Đánh giá xuất sắc",
    description: "Được khách hàng tin tưởng và đánh giá cao",
  },
];

const SectionWhyChooseCondotel: FC<SectionWhyChooseCondotelProps> = ({
  className = "",
  gridClassName = "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
}) => {
  return (
    <div
      className={`nc-SectionWhyChooseCondotel relative ${className}`}
      data-nc-id="SectionWhyChooseCondotel"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-3xl -z-10"></div>

      {/* Header Section */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-0">
        <div className="mb-16">
          <Heading
            isCenter
            desc="Khám phá những ưu điểm vượt trội của các căn hộ condotel"
          >
            ✨ Tại sao chọn Condotel?
          </Heading>
        </div>

        {/* Features Grid */}
        <div className={`grid gap-8 ${gridClassName}`}>
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="group relative bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm hover:shadow-xl dark:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon Container */}
              <div className="mb-4 inline-flex items-center justify-center">
                <div className="text-5xl transition-transform group-hover:scale-110 duration-300">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full group-hover:w-full transition-all duration-500"></div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 rounded-3xl overflow-hidden">
            <div className="px-8 py-12 md:px-12 md:py-16 relative z-10 text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Sẵn sàng tìm căn condotel hoàn hảo?
              </h3>
              <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
                Khám phá hàng nghìn căn hộ condotel chất lượng cao trên toàn Việt Nam
              </p>
              <a
                href="/listing-stay"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-lg transition-colors"
              >
                Tìm Condotel Ngay
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionWhyChooseCondotel;
