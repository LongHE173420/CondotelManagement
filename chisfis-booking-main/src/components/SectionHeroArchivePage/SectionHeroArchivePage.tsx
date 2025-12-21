import React, { FC, ReactNode } from "react";
import imagePng from "images/hero-right2.png";
import HeroSearchForm, {
  SearchTab,
} from "components/HeroSearchForm/HeroSearchForm";
import { useTranslation } from "i18n/LanguageContext";

export interface SectionHeroArchivePageProps {
  className?: string;
  listingType?: ReactNode;
  currentPage: "Stays";
  currentTab: SearchTab;
  rightImage?: string;
  locationName?: string;
  propertyCount?: number;
}

const SectionHeroArchivePage: FC<SectionHeroArchivePageProps> = ({
  className = "",
  listingType,
  currentPage,
  currentTab,
  rightImage = imagePng,
  locationName,
  propertyCount,
}) => {
  const { t } = useTranslation();
  
  // Default location name if not provided
  const displayLocation = locationName || t.condotel.allCondotels || "Tất cả Condotel";
  const displayCount = propertyCount !== undefined ? propertyCount : 0;

  return (
    <div
      className={`nc-SectionHeroArchivePage flex flex-col relative ${className}`}
      data-nc-id="SectionHeroArchivePage"
    >
      <div className="flex flex-col lg:flex-row lg:items-center">
        <div className="flex-shrink-0 lg:w-1/2 flex flex-col items-start space-y-6 lg:space-y-10 pb-14 lg:pb-64 xl:pb-80 xl:pr-14 lg:mr-10 xl:mr-0">
          <h2 className="font-medium text-4xl md:text-5xl xl:text-7xl leading-[110%]">
            {displayLocation}
          </h2>
          <div className="flex items-center text-base md:text-lg text-neutral-500 dark:text-neutral-400">
            <i className="text-2xl las la-map-marked"></i>
            <span className="ml-2.5">{t.condotel.location || "Việt Nam"}</span>
            <span className="mx-5"></span>
            {listingType ? (
              listingType
            ) : (
              <>
                <i className="text-2xl las la-home"></i>
                <span className="ml-2.5">
                  {displayCount} {displayCount !== 1 
                    ? (t.condotel.list || "condotels") 
                    : (t.condotel.list === "condotels" ? "condotel" : (t.condotel.list || "condotel"))}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex-grow">
          <img className="w-full" src={rightImage} alt="hero" />
        </div>
      </div>

      <div className="hidden lg:flow-root w-full">
        <div className="z-10 lg:-mt-40 xl:-mt-56 w-full">
          <HeroSearchForm currentPage={currentPage} currentTab={currentTab} />
        </div>
      </div>
    </div>
  );
};

export default SectionHeroArchivePage;
