import React, { FC } from "react";
import { Link } from "react-router-dom";
import NcImage from "shared/NcImage/NcImage";
import rightImgDemo from "images/BecomeAnAuthorImg.png";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import Logo from "shared/Logo/Logo";

export interface SectionBecomeAnAuthorProps {
  className?: string;
  rightImg?: string;
}

const SectionBecomeAnAuthor: FC<SectionBecomeAnAuthorProps> = ({
  className = "",
  rightImg = rightImgDemo,
}) => {
  return (
    <div
      className={`nc-SectionBecomeAnAuthor relative flex flex-col lg:flex-row items-center  ${className}`}
      data-nc-id="SectionBecomeAnAuthor"
    >
      <div className="flex-shrink-0 mb-16 lg:mb-0 lg:mr-10 lg:w-2/5">
        <Logo className="w-20" />
        <h2 className="font-semibold text-3xl sm:text-4xl mt-6 sm:mt-11">
          Tại sao bạn chọn chúng tôi?
        </h2>
        <span className="block mt-6 text-neutral-500 dark:text-neutral-400">
          Đồng hành cùng chúng tôi, bạn có một chuyến đi đầy trải nghiệm. Với Chisfis,
          đặt phòng lưu trú, biệt thự resort, khách sạn, nhà riêng,
          căn hộ... trở nên nhanh chóng, tiện lợi và dễ dàng.
        </span>
        <Link to="/become-a-host">
          <ButtonPrimary className="mt-6 sm:mt-11">
            Trở thành Host
          </ButtonPrimary>
        </Link>
      </div>
      <div className="flex-grow">
        <NcImage src={rightImg} />
      </div>
    </div>
  );
};

export default SectionBecomeAnAuthor;
