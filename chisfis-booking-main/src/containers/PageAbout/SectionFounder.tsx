import Heading from "components/Heading/Heading";
import React from "react";
import NcImage from "shared/NcImage/NcImage";
import { StarIcon } from "@heroicons/react/24/solid";

export interface People {
  id: string;
  name: string;
  job: string;
  avatar: string;
  bio?: string;
}

const FOUNDER_DEMO: People[] = [
  {
    id: "1",
    name: `Nguyễn Văn A`,
    job: "Đồng sáng lập & Giám đốc điều hành",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80",
    bio: "15+ năm kinh nghiệm trong lĩnh vực kinh doanh bất động sản",
  },
  {
    id: "4",
    name: `Trần Thị B`,
    job: "Đồng sáng lập & Giám đốc công nghệ",
    avatar:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80",
    bio: "Chuyên gia phát triển phần mềm với 12 năm kinh nghiệm",
  },
  {
    id: "3",
    name: `Lê Văn C`,
    job: "Đồng sáng lập & Chủ tịch",
    avatar:
      "https://images.unsplash.com/photo-1560365163-3e8d64e762ef?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80",
    bio: "Nhà lãnh đạo chiến lược với kinh nghiệm quản lý công ty 20 năm",
  },
  {
    id: "2",
    name: `Phạm Thị D`,
    job: "Đồng sáng lập & Giám đốc chiến lược",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&q=80",
    bio: "Chuyên gia tiếp thị với thành tích phát triển thương hiệu quốc tế",
  },
];

const SectionFounder = () => {
  return (
    <div className="nc-SectionFounder relative">
      <Heading
        desc="Đội ngũ sáng lập của chúng tôi với nhiều năm kinh nghiệm trong ngành bất động sản và công nghệ, cam kết mang đến dịch vụ tốt nhất cho khách hàng."
      >
        ⛱ Đội ngũ lãnh đạo
      </Heading>
      <div className="grid sm:grid-cols-2 gap-8 lg:grid-cols-4">
        {FOUNDER_DEMO.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col"
          >
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-12 -mt-12"></div>

            {/* Avatar */}
            <div className="relative mb-6 z-10">
              <div className="relative h-32 w-32 mx-auto">
                <NcImage
                  containerClassName="relative h-0 aspect-h-1 aspect-w-1 rounded-full overflow-hidden ring-4 ring-blue-100 dark:ring-blue-900"
                  className="absolute inset-0 object-cover"
                  src={item.avatar}
                />
              </div>
            </div>

            {/* Content */}
            <div className="text-center flex-1 z-10">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {item.name}
              </h3>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">
                {item.job}
              </p>

              {/* Bio */}
              {item.bio && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                  {item.bio}
                </p>
              )}

              {/* Rating stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className="w-4 h-4 text-amber-400"
                  />
                ))}
              </div>

              {/* Social links placeholder */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Kết nối với chúng tôi
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Company values section */}
      <div className="mt-16 pt-16 border-t border-neutral-200 dark:border-neutral-700">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-neutral-900 dark:text-neutral-100">
          💡 Giá trị cốt lõi của Fiscondotel
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Khách hàng là ưu tiên
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-400">
              Mỗi quyết định của chúng tôi đều dựa trên lợi ích của khách hàng
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Đổi mới không ngừng
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-400">
              Chúng tôi liên tục cải thiện công nghệ và dịch vụ
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Tin tưởng và minh bạch
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-400">
              Thành thật, minh bạch trong mọi giao dịch với khách hàng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionFounder;
