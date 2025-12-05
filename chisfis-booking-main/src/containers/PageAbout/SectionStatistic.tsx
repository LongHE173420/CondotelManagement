import React, { FC } from "react";
import Heading from "components/Heading/Heading";

export interface Statistic {
  id: string;
  heading: string;
  subHeading: string;
}

const FOUNDER_DEMO: Statistic[] = [
  {
    id: "1",
    heading: "1000+",
    subHeading:
      "Căn hộ condotel chất lượng cao trên toàn quốc",
  },
  {
    id: "2",
    heading: "50,000+",
    subHeading: "Khách hàng đã tin tưởng và sử dụng dịch vụ",
  },
  {
    id: "3",
    heading: "100+",
    subHeading:
      "Địa điểm du lịch và thành phố trên khắp Việt Nam",
  },
];

export interface SectionStatisticProps {
  className?: string;
}

const SectionStatistic: FC<SectionStatisticProps> = ({ className = "" }) => {
  return (
    <div className={`nc-SectionStatistic relative ${className}`}>
      <Heading
        desc="Những con số ấn tượng thể hiện sự phát triển và uy tín của Fiscondotel trong ngành bất động sản du lịch."
      >
        🚀 Thống kê nhanh
      </Heading>
      <div className="grid md:grid-cols-2 gap-6 lg:grid-cols-3 xl:gap-8">
        {FOUNDER_DEMO.map((item) => (
          <div
            key={item.id}
            className="p-6 bg-neutral-50 dark:bg-neutral-800 rounded-2xl dark:border-neutral-800"
          >
            <h3 className="text-2xl font-semibold leading-none text-neutral-900 md:text-3xl dark:text-neutral-200">
              {item.heading}
            </h3>
            <span className="block text-sm text-neutral-500 mt-3 sm:text-base dark:text-neutral-400">
              {item.subHeading}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionStatistic;
