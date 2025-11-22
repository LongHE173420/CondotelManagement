import React, { FC, useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import BgGlassmorphism from "components/BgGlassmorphism/BgGlassmorphism";
import SectionGridAuthorBox from "components/SectionGridAuthorBox/SectionGridAuthorBox";
import SectionHeroArchivePage from "components/SectionHeroArchivePage/SectionHeroArchivePage";
import SectionSliderNewCategories from "components/SectionSliderNewCategories/SectionSliderNewCategories";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import SectionGridHasMap from "./SectionGridHasMap";
import { Helmet } from "react-helmet";
import imagePng from "images/hero-right.png";
import condotelAPI from "api/condotel";
import { useTranslation } from "i18n/LanguageContext";

export interface ListingStayMapPageProps {
  className?: string;
}

const ListingStayMapPage: FC<ListingStayMapPageProps> = ({
  className = "",
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchLocation = params.get("location");
  const searchFromDate = params.get("startDate");
  const searchToDate = params.get("endDate");
  const [propertyCount, setPropertyCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        // Build search query
        const searchQuery: any = {};
        if (searchLocation) {
          searchQuery.location = searchLocation;
        }
        if (searchFromDate) {
          searchQuery.fromDate = searchFromDate;
        }
        if (searchToDate) {
          searchQuery.toDate = searchToDate;
        }
        
        const condotels = await condotelAPI.search(searchQuery);
        setPropertyCount(condotels.length);
      } catch (err) {
        console.error("Error fetching condotel count:", err);
        setPropertyCount(0);
      }
    };
    fetchCount();
  }, [searchLocation, searchFromDate, searchToDate]);

  return (
    <div
      className={`nc-ListingStayMapPage relative ${className}`}
      data-nc-id="ListingStayMapPage"
    >
      <Helmet>
        <title>
          {searchLocation 
            ? `${t.condotel.staysIn || "Stays in"} ${searchLocation} - Chisfis`
            : `${t.condotel.allCondotels || "Tất cả Condotel"} - Chisfis`}
        </title>
      </Helmet>
      <BgGlassmorphism />

      {/* SECTION HERO */}
      <div className="container pt-10 pb-24 lg:pt-16 lg:pb-28">
        <SectionHeroArchivePage 
          currentPage="Stays" 
          currentTab="Stays"
          locationName={
            searchLocation 
              ? `${t.condotel.staysIn || "Stays in"} ${searchLocation}`
              : (t.condotel.allCondotels || "Tất cả Condotel")
          }
          propertyCount={propertyCount}
          rightImage={imagePng}
        />
      </div>

      {/* SECTION */}
      <div className="container pb-24 lg:pb-28 2xl:pl-10 xl:pr-0 xl:max-w-none">
        <SectionGridHasMap />
      </div>

      <div className="container overflow-hidden">
        {/* SECTION 1 */}
        <div className="relative py-16">
          <BackgroundSection />
          <SectionSliderNewCategories
            heading="Explore by types of stays"
            subHeading="Explore houses based on 10 types of stays"
            categoryCardType="card5"
            itemPerRow={5}
            sliderStyle="style2"
            uniqueClassName="ListingStayMapPage"
          />
        </div>

        {/* SECTION */}
        <SectionSubscribe2 className="py-24 lg:py-28" />

        {/* SECTION */}
        <div className="relative py-16 mb-24 lg:mb-28">
          <BackgroundSection className="bg-orange-50 dark:bg-black dark:bg-opacity-20 " />
          <SectionGridAuthorBox />
        </div>
      </div>
    </div>
  );
};

export default ListingStayMapPage;
