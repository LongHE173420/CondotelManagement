import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import BgGlassmorphism from "components/BgGlassmorphism/BgGlassmorphism";
import SectionHeroArchivePage from "components/SectionHeroArchivePage/SectionHeroArchivePage";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import SectionCondotelFeatures from "components/SectionCondotelFeatures/SectionCondotelFeatures";
import SectionTopHostCondotel from "components/SectionTopHostCondotel/SectionTopHostCondotel";
import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import SectionGridFilterCard from "./SectionGridFilterCard";
import { Helmet } from "react-helmet";
import { useTranslation } from "i18n/LanguageContext";
import condotelAPI from "api/condotel";
import locationAPI from "api/location";

export interface ListingStayPageProps {
  className?: string;
}

const ListingStayPage: FC<ListingStayPageProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const stateParams = (location.state as any)?.searchParams || {};
  const [propertyCount, setPropertyCount] = useState<number>(0);
  const [locationName, setLocationName] = useState<string>("");
  
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchLocation =
    params.get("location") ||
    params.get("searchLocation") ||
    params.get("locationName") ||
    params.get("city") ||
    stateParams.location ||
    stateParams.searchLocation ||
    stateParams.locationName ||
    stateParams.city;
  const searchLocationId =
    params.get("locationId") ||
    params.get("searchLocationId") ||
    params.get("cityId") ||
    stateParams.locationId ||
    stateParams.searchLocationId ||
    stateParams.cityId;
  const searchHostId = params.get("hostId");
  const searchFromDate = params.get("startDate");
  const searchToDate = params.get("endDate");
  const searchGuests = params.get("guests");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const beds = params.get("beds");
  const bathrooms = params.get("bathrooms");

  // Load location name if locationId is provided
  useEffect(() => {
    const loadLocationName = async () => {
      if (searchLocationId) {
        try {
          const locationId = Number(searchLocationId);
          if (!isNaN(locationId)) {
            const locationData = await locationAPI.getByIdPublic(locationId);
            setLocationName(locationData.name);
          }
        } catch (err) {
          setLocationName("");
        }
      } else {
        setLocationName(searchLocation || "");
      }
    };
    loadLocationName();
  }, [searchLocationId, searchLocation]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        // Build search query
        const searchQuery: any = {};
        
        // Host ID filter (ưu tiên cao nhất)
        if (searchHostId) {
          const hostId = Number(searchHostId);
          if (!isNaN(hostId)) {
            searchQuery.hostId = hostId;
          }
        }
        
        // Ưu tiên locationId hơn location string (chỉ nếu không có hostId)
        if (!searchHostId) {
          if (searchLocationId) {
            const locationId = Number(searchLocationId);
            if (!isNaN(locationId)) {
              searchQuery.locationId = locationId;
            }
          } else if (searchLocation) {
            searchQuery.location = searchLocation;
          }
        }
        
        if (searchFromDate) {
          searchQuery.fromDate = searchFromDate;
          searchQuery.startDate = searchFromDate;
        }
        if (searchToDate) {
          searchQuery.toDate = searchToDate;
          searchQuery.endDate = searchToDate;
        }
        
        // Add price filters
        if (minPrice) {
          const minPriceNum = Number(minPrice);
          if (!isNaN(minPriceNum) && minPriceNum > 0) {
            searchQuery.minPrice = minPriceNum;
          }
        }
        if (maxPrice) {
          const maxPriceNum = Number(maxPrice);
          if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
            searchQuery.maxPrice = maxPriceNum;
          }
        }
        
        // Add beds and bathrooms filters
        if (beds) {
          const bedsNum = Number(beds);
          if (!isNaN(bedsNum) && bedsNum > 0) {
            searchQuery.beds = bedsNum;
          }
        }
        if (bathrooms) {
          const bathroomsNum = Number(bathrooms);
          if (!isNaN(bathroomsNum) && bathroomsNum > 0) {
            searchQuery.bathrooms = bathroomsNum;
          }
        }

        // Always fetch all condotels to get count
        const result = await condotelAPI.search(searchQuery);
        if (result && Array.isArray(result)) {
          setPropertyCount(result.length);
        } else {
          setPropertyCount(0);
        }
      } catch (err) {
        setPropertyCount(0);
      }
    };
    fetchCount();
  }, [searchLocation, searchLocationId, searchHostId, searchFromDate, searchToDate, minPrice, maxPrice, beds, bathrooms]);
  
  return (
    <div
      className={`nc-ListingStayPage relative overflow-hidden ${className}`}
      data-nc-id="ListingStayPage"
    >
      <Helmet>
        <title>
          {(searchLocationId || searchLocation || locationName)
            ? `${t.condotel.staysIn || "Stays in"} ${locationName || searchLocation || "Location"}` 
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
            (searchLocationId || searchLocation || locationName)
              ? `${t.condotel.staysIn || "Stays in"} ${locationName || searchLocation || "Location"}`
              : (t.condotel.allCondotels || "Tất cả Condotel")
          }
          propertyCount={propertyCount}
          className="pt-10 pb-24 lg:pb-28 lg:pt-16 "
        />

        {/* SECTION */}
        <SectionGridFilterCard className="pb-24 lg:pb-28" />

        {/* SECTION 1 */}
        <SectionCondotelFeatures />

        {/* SECTION - Top Hosts */}
        <div className="relative py-16">
          <BackgroundSection className="bg-blue-50 dark:bg-black dark:bg-opacity-20 " />
          <SectionTopHostCondotel />
        </div>

        {/* SECTION */}
        <SectionSubscribe2 className="py-24 lg:py-28" />
      </div>
    </div>
  );
};

export default ListingStayPage;
