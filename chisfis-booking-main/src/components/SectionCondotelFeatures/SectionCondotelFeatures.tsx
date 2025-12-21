import React from "react";
import { FC } from "react";
import Heading from "components/Heading/Heading";

interface SectionCondotelFeaturesProps {
  className?: string;
}

const SectionCondotelFeatures: FC<SectionCondotelFeaturesProps> = ({
  className = "",
}) => {
  const features = [
    {
      id: 1,
      icon: "🏢",
      title: "Căn hộ cao cấp",
      description: "Các căn hộ được thiết kế hiện đại với đầy đủ tiện nghi",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 2,
      icon: "🌆",
      title: "Vị trí đắc địa",
      description: "Nằm tại những vị trí trung tâm, gần các điểm du lịch nổi tiếng",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: 3,
      icon: "🏊",
      title: "Tiện ích toàn diện",
      description: "Hồ bơi, gym, nhà hàng và các dịch vụ cao cấp",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 4,
      icon: "💼",
      title: "Quản lý chuyên nghiệp",
      description: "Đội ngũ quản lý 24/7 đảm bảo chất lượng dịch vụ",
      color: "from-orange-500 to-red-500",
    },
    {
      id: 5,
      icon: "⭐",
      title: "Đánh giá xuất sắc",
      description: "Được khách hàng tin tưởng và đánh giá cao",
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: 6,
      icon: "🎯",
      title: "Giá cạnh tranh",
      description: "Giá phù hợp, nhiều ưu đãi và gói dịch vụ linh hoạt",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  return (
    <div className={`nc-SectionCondotelFeatures relative py-16 ${className}`}>
      <div className="container">
        <Heading
          desc="Khám phá những ưu điểm vượt trội của các căn hộ condotel"
          isCenter
        >
          ✨ Tại sao chọn Condotel?
        </Heading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group relative bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

              {/* Icon */}
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} style={{width: "30%"}} />
            </div>
          ))}
        </div>

        {/* Call to action section */}
        <div className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-700">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Sẵn sàng tìm căn hộ lý tưởng?
            </h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
              Duyệt qua hàng trăm căn hộ condotel được quản lý chuyên nghiệp và có đánh giá tuyệt vời từ khách hàng.
            </p>
            <a
              href="/listing-stay"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Khám phá ngay →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionCondotelFeatures;
