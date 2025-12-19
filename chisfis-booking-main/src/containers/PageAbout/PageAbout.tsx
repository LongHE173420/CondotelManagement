import rightImg from "images/about-hero-right.png";
import React, { FC } from "react";
import SectionStatistic from "./SectionStatistic";
import SectionWhyChoose from "./SectionWhyChoose";
import { Helmet } from "react-helmet";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import BgGlassmorphism from "components/BgGlassmorphism/BgGlassmorphism";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import SectionHero from "./SectionHero";
import SectionOurFeatures from "components/SectionOurFeatures/SectionOurFeatures";

export interface PageAboutProps {
  className?: string;
}

const PageAbout: FC<PageAboutProps> = ({ className = "" }) => {
  return (
    <div
      className={`nc-PageAbout overflow-hidden relative ${className}`}
      data-nc-id="PageAbout"
    >
      <Helmet>
        <title>Về chúng tôi || Fiscondotel</title>
      </Helmet>

      {/* ======== BG GLASS ======== */}
      <BgGlassmorphism />

      <div className="container py-16 lg:py-28 space-y-16 lg:space-y-28">
        <SectionHero
          rightImg={rightImg}
          heading="👋 Về chúng tôi"
          btnText=""
          subHeading="Fiscondotel là nền tảng đặt phòng condotel hàng đầu tại Việt Nam. Chúng tôi cam kết mang đến trải nghiệm tuyệt vời cho khách hàng với dịch vụ chất lượng cao, giá cả hợp lý và hỗ trợ 24/7."
        />

        <SectionWhyChoose />

        <div className="relative py-16">
          <BackgroundSection />
          <SectionOurFeatures type="type2" />
        </div>

        <SectionStatistic />

        <SectionSubscribe2 />
      </div>
    </div>
  );
};

export default PageAbout;
