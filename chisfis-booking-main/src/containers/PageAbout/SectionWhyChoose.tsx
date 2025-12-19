import React, { FC } from "react";
import { CheckCircleIcon, StarIcon, ShieldCheckIcon, HeartIcon } from "@heroicons/react/24/solid";

export interface SectionWhyChooseProps {
  className?: string;
}

const SectionWhyChoose: FC<SectionWhyChooseProps> = ({ className = "" }) => {
  const reasons = [
    {
      icon: StarIcon,
      title: "Chất lượng hàng đầu",
      description: "Những condotel được lựa chọn kỹ lưỡng, đảm bảo tiêu chuẩn cao nhất"
    },
    {
      icon: ShieldCheckIcon,
      title: "An toàn & Bảo mật",
      description: "Hệ thống bảo mật tối tân, bảo vệ thông tin và giao dịch của bạn"
    },
    {
      icon: HeartIcon,
      title: "Dịch vụ tận tâm",
      description: "Hỗ trợ khách hàng 24/7 với đội ngũ chuyên nghiệp và thân thiện"
    },
    {
      icon: CheckCircleIcon,
      title: "Giá cả cạnh tranh",
      description: "Mức giá phù hợp với chất lượng, không phí ẩn, minh bạch hoàn toàn"
    }
  ];

  return (
    <div
      className={`nc-SectionWhyChoose ${className}`}
      data-nc-id="SectionWhyChoose"
    >
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 text-center mb-4">
          🌟 Tại sao chọn Fiscondotel?
        </h2>
        <p className="text-center text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Chúng tôi tự hào là nền tảng đặt phòng condotel uy tín, được hàng nghìn khách hàng lựa chọn
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reasons.map((reason, index) => {
          const Icon = reason.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-neutral-100 dark:border-neutral-700"
            >
              <div className="flex justify-center mb-4">
                <Icon className="w-12 h-12 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white text-center mb-2">
                {reason.title}
              </h3>
              <p className="text-center text-neutral-600 dark:text-neutral-400 text-sm">
                {reason.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionWhyChoose;
