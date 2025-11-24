import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import BgGlassmorphism from "components/BgGlassmorphism/BgGlassmorphism";
import SectionGridAuthorBox from "components/SectionGridAuthorBox/SectionGridAuthorBox";
import SectionHeroArchivePage from "components/SectionHeroArchivePage/SectionHeroArchivePage";
import SectionSliderNewCategories from "components/SectionSliderNewCategories/SectionSliderNewCategories";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import SectionGridFilterCard from "./SectionGridFilterCard";
import { Helmet } from "react-helmet";
import { useTranslation } from "i18n/LanguageContext";
import condotelAPI from "api/condotel";

export interface ListingStayPageProps {
  className?: string;
}

const ListingStayPage: FC<ListingStayPageProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [propertyCount, setPropertyCount] = useState<number>(0);
  
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchLocation = params.get("location");
  const searchFromDate = params.get("startDate");
  const searchToDate = params.get("endDate");

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
        
        // Always fetch all condotels to get count
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
      className={`nc-ListingStayPage relative overflow-hidden ${className}`}
      data-nc-id="ListingStayPage"
    >
      <Helmet>
        <title>
          {searchLocation 
            ? `${t.condotel.staysIn || "Stays in"} ${searchLocation}` 
            : (t.condotel.allCondotels || "Tất cả Condotel")} - Fiscondotel
        </title>
      </Helmet>
      <BgGlassmorphism />

      <div className="container relative overflow-hidden">
        {/* SECTION HERO */}
        <SectionHeroArchivePage
          currentPage="Stays"
          currentTab="Stays"
          locationName={
            searchLocation 
              ? `${t.condotel.staysIn || "Stays in"} ${searchLocation}`
              : (t.condotel.allCondotels || "Tất cả Condotel")
          }
          propertyCount={propertyCount}
          className="pt-10 pb-24 lg:pb-28 lg:pt-16 "
        />

        {/* SECTION */}
        <SectionGridFilterCard className="pb-24 lg:pb-28" />

        {/* SECTION 1 */}
        <div className="relative py-16">
          <BackgroundSection />
          <SectionSliderNewCategories
            heading={t.home.exploreByType}
            subHeading={t.home.exploreByTypeSubtitle}
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

export default ListingStayPage;
