import React, { FC } from "react";
import rightImgPng from "images/our-features.png";
import NcImage from "shared/NcImage/NcImage";
import Badge from "shared/Badge/Badge";
import { useTranslation } from "i18n/LanguageContext";

export interface SectionOurFeaturesProps {
  className?: string;
  rightImg?: string;
  type?: "type1" | "type2";
}

const SectionOurFeatures: FC<SectionOurFeaturesProps> = ({
  className = "lg:py-14",
  rightImg = rightImgPng,
  type = "type1",
}) => {
  const { t } = useTranslation();
  
  return (
    <div
      className={`nc-SectionOurFeatures relative flex flex-col items-center ${
        type === "type1" ? "lg:flex-row" : "lg:flex-row-reverse"
      } ${className}`}
      data-nc-id="SectionOurFeatures"
    >
      <div className="flex-grow">
        <NcImage src={rightImg} />
      </div>
      <div
        className={`max-w-2xl flex-shrink-0 mt-10 lg:mt-0 lg:w-2/5 ${
          type === "type1" ? "lg:pl-16" : "lg:pr-16"
        }`}
      >
        <span className="uppercase text-sm text-gray-400 tracking-widest">
          {t.home.features.title}
        </span>
        <h2 className="font-semibold text-4xl mt-5">{t.home.features.subtitle}</h2>

        <ul className="space-y-10 mt-16">
          <li className="space-y-4">
            <Badge name={t.home.features.feature1.badge} />
            <span className="block text-xl font-semibold">
              {t.home.features.feature1.title}
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              {t.home.features.feature1.desc}
            </span>
          </li>
          <li className="space-y-4">
            <Badge color="green" name={t.home.features.feature2.badge} />
            <span className="block text-xl font-semibold">
              {t.home.features.feature2.title}
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              {t.home.features.feature2.desc}
            </span>
          </li>
          <li className="space-y-4">
            <Badge color="red" name={t.home.features.feature3.badge} />
            <span className="block text-xl font-semibold">
              {t.home.features.feature3.title}
            </span>
            <span className="block mt-5 text-neutral-500 dark:text-neutral-400">
              {t.home.features.feature3.desc}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SectionOurFeatures;
