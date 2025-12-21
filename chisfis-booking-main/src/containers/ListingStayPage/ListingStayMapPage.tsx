import React, { FC, useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import BgGlassmorphism from "components/BgGlassmorphism/BgGlassmorphism";
import SectionGridAuthorBox from "components/SectionGridAuthorBox/SectionGridAuthorBox";
import SectionHeroArchivePage from "components/SectionHeroArchivePage/SectionHeroArchivePage";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import SectionWhyChooseCondotel from "components/SectionWhyChooseCondotel/SectionWhyChooseCondotel";
import SectionGridNoMap from "./SectionGridNoMap";
import { Helmet } from "react-helmet";
import imagePng from "images/hero-right.png";
import condotelAPI from "api/condotel";
import { useTranslation } from "i18n/LanguageContext";
import hostAPI, { TopHostDTO } from "api/host";
import { AuthorType } from "data/types";
import { toastError } from "utils/toast";

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
  const searchLocationId = params.get("locationId");
  const searchHostId = params.get("hostId");
  const searchFromDate = params.get("startDate");
  const searchToDate = params.get("endDate");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const beds = params.get("beds");
  const bathrooms = params.get("bathrooms");
  const [propertyCount, setPropertyCount] = useState<number>(0);
  const [topHosts, setTopHosts] = useState<AuthorType[]>([]);

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
        }
        if (searchToDate) {
          searchQuery.toDate = searchToDate;
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
        
        // Call API to get total count
        const result = await condotelAPI.search(searchQuery);
        // Result is an array, so the count is the array length
        setPropertyCount(result.length);
      } catch (err) {
        setPropertyCount(0);
      }
    };
    fetchCount();
  }, [location.search]); // Use location.search to trigger on any URL param change

  // Load top hosts from API
  useEffect(() => {
    const loadTopHosts = async () => {
      try {
        const topHostsData = await hostAPI.getTopRated(10);
        
        if (!topHostsData || !Array.isArray(topHostsData) || topHostsData.length === 0) {
          setTopHosts([]);
          return;
        }
        
        // Map TopHostDTO to AuthorType
        const mappedHosts: AuthorType[] = topHostsData.map((host: TopHostDTO) => {
          const nameParts = (host.fullName || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          // Hiển thị fullName (tên host) thay vì companyName
          const displayName = host.fullName || 'Host';
          
          return {
            id: host.hostId.toString(),
            firstName: firstName,
            lastName: lastName,
            displayName: displayName,
            avatar: host.avatarUrl || '',
            count: host.totalCondotels || 0,
            desc: `${host.totalReviews || 0} đánh giá • ${host.totalCondotels || 0} condotel`,
            jobName: host.companyName || 'Host',
            href: `/author/${host.hostId}`,
            starRating: host.averageRating || 0,
          };
        });
        
        setTopHosts(mappedHosts);
      } catch (err: any) {
        toastError("Không thể tải danh sách host nổi bật");
        setTopHosts([]);
      }
    };

    loadTopHosts();
  }, []);

  return (
    <div
      className={`nc-ListingStayMapPage relative ${className}`}
      data-nc-id="ListingStayMapPage"
    >
      <Helmet>
        <title>
          {searchLocation 
            ? `${t.condotel.staysIn || "Stays in"} ${searchLocation} - Fiscondotel`
            : `${t.condotel.allCondotels || "Tất cả Condotel"} - Fiscondotel`}
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
      <div className="container pb-24 lg:pb-28">
        <SectionGridNoMap />
      </div>

      <div className="container overflow-hidden">
        {/* SECTION - Why Choose Condotel */}
        <div className="relative py-16">
          <BackgroundSection className="bg-amber-50 dark:bg-black dark:bg-opacity-20 " />
          <SectionWhyChooseCondotel />
        </div>

        {/* SECTION */}
        <SectionSubscribe2 className="py-24 lg:py-28" />

        {/* SECTION */}
        <div className="relative py-16 mb-24 lg:mb-28">
          <BackgroundSection className="bg-orange-50 dark:bg-black dark:bg-opacity-20 " />
          <SectionGridAuthorBox authors={topHosts} />
        </div>
      </div>
    </div>
  );
};

export default ListingStayMapPage;
