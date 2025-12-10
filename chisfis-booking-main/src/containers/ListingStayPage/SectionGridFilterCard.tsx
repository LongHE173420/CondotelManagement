import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { DEMO_STAY_LISTINGS } from "data/listings";
import { StayDataType } from "data/types";
import Pagination from "shared/Pagination/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "components/Heading/Heading2";
import { condotelAPI, CondotelDTO } from "api/condotel";
import CondotelCard from "components/CondotelCard/CondotelCard";
import { TaxonomyType } from "data/types";
import { useTranslation } from "i18n/LanguageContext";
import moment from "moment";

export interface SectionGridFilterCardProps {
  className?: string;
  data?: StayDataType[];
}

const DEMO_DATA: StayDataType[] = DEMO_STAY_LISTINGS.filter((_, i) => i < 8);

// Default category for condotels
const DEFAULT_CONDOTEL_CATEGORY: TaxonomyType = {
  id: "condotel",
  name: "Condotel",
  href: "/listing-stay",
  taxonomy: "category",
  listingType: "stay",
};

// Helper function to convert CondotelDTO to StayDataType for compatibility
const convertCondotelToStay = (condotel: CondotelDTO): StayDataType => {
  return {
    id: condotel.condotelId.toString(),
    author: {
      id: "1",
      firstName: condotel.hostName || "Host",
      lastName: "",
      displayName: condotel.hostName || "Host",
      avatar: "",
      count: 0,
      desc: "",
      jobName: "Host",
      href: "/",
    },
    date: new Date().toISOString(),
    href: `/listing-stay-detail/${condotel.condotelId}`,
    title: condotel.name,
    featuredImage: condotel.thumbnailUrl || "/images/placeholder.png",
    galleryImgs: condotel.thumbnailUrl ? [condotel.thumbnailUrl] : [],
    commentCount: 0,
    viewCount: 0,
    like: false,
    address: condotel.resortName || "",
    reviewStart: 0,
    reviewCount: 0,
    price: (condotel.pricePerNight || 0).toString(),
    listingCategory: DEFAULT_CONDOTEL_CATEGORY,
    maxGuests: condotel.beds || 0,
    bedrooms: condotel.beds || 0,
    bathrooms: condotel.bathrooms || 0,
    saleOff: undefined,
    isAds: false,
    map: {
      lat: 0,
      lng: 0,
    },
  };
};

const SectionGridFilterCard: FC<SectionGridFilterCardProps> = ({
  className = "",
  data,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchLocation = params.get("location");
  const searchLocationId = params.get("locationId");
  const searchHostId = params.get("hostId");
  const searchFromDate = params.get("startDate");
  const searchToDate = params.get("endDate");
  const searchGuests = params.get("guests");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const beds = params.get("beds");
  const bathrooms = params.get("bathrooms");

  useEffect(() => {
    const fetchCondotels = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Build search query
        const searchQuery: any = {};
        
        // Host ID filter (ưu tiên cao nhất)
        if (searchHostId) {
          const hostId = Number(searchHostId);
          if (!isNaN(hostId)) {
            searchQuery.hostId = hostId;
            console.log("🔍 Searching with hostId:", hostId);
          }
        }
        
        // Ưu tiên locationId hơn location string (chỉ nếu không có hostId)
        if (!searchHostId) {
          if (searchLocationId) {
            const locationId = Number(searchLocationId);
            if (!isNaN(locationId)) {
              searchQuery.locationId = locationId;
              console.log("🔍 Searching with locationId:", locationId);
            }
          } else if (searchLocation) {
            // Trim và decode location để đảm bảo đúng format
            const locationValue = decodeURIComponent(searchLocation.trim());
            searchQuery.location = locationValue;
            console.log("🔍 Searching with location:", locationValue);
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
        
        console.log("📤 Search query:", searchQuery);
        console.log("📤 URL params:", {
          searchLocation,
          searchLocationId,
          searchHostId,
          searchFromDate,
          searchToDate,
          minPrice,
          maxPrice,
          beds,
          bathrooms
        });
        
        // Nếu có hostId, sử dụng API riêng để lấy condotels của host
        let results: CondotelDTO[] = [];
        if (searchHostId) {
          const hostId = Number(searchHostId);
          if (!isNaN(hostId)) {
            console.log("🏠 Fetching condotels for host:", hostId);
            results = await condotelAPI.getCondotelsByHostId(hostId);
            console.log("✅ Loaded condotels for host:", results.length);
          }
        } else {
          // Always fetch condotels - if no search params, get all condotels
          results = await condotelAPI.search(searchQuery);
          console.log("✅ Search results:", results.length, "condotels found");
        }
        
        console.log("✅ Results:", results);
        
        // Ensure we only set the results from the search, not all condotels
        setCondotels(results);
      } catch (err: any) {
        console.error("Error fetching condotels:", err);
        setError(err.response?.data?.message || "Không thể tải danh sách condotel");
        setCondotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCondotels();
  }, [searchLocation, searchLocationId, searchFromDate, searchToDate, minPrice, maxPrice, beds, bathrooms]); // Use specific params to trigger on changes

  const heading = searchLocation 
    ? `${t.condotel.staysIn || "Stays in"} ${searchLocation}`
    : t.condotel.allCondotels || "Tất cả Condotel";

  // Build subheading
  let subHeadingText = "";
  if (searchLocation) {
    subHeadingText = `${condotels.length} ${t.condotel.list || "condotels"}`;
    if (searchFromDate && searchToDate) {
      const fromDate = moment(searchFromDate).format("MMM DD");
      const toDate = moment(searchToDate).format("MMM DD");
      subHeadingText += ` · ${fromDate} - ${toDate}`;
    }
    if (searchGuests) {
      subHeadingText += ` · ${searchGuests} ${t.booking.guests || "Guests"}`;
    }
  } else {
    subHeadingText = `${t.condotel.total || "Tổng cộng"}: ${condotels.length} ${t.condotel.list || "condotel"}`;
  }

  return (
    <div
      className={`nc-SectionGridFilterCard ${className}`}
      data-nc-id="SectionGridFilterCard"
    >
      <Heading2 
        heading={heading}
        subHeading={subHeadingText}
      />

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-8 lg:mb-11">
        <TabFilters />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">{t.common.loading}</p>
        </div>
      ) : condotels.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            {searchLocation 
              ? `${t.condotel.noResults || "Không tìm thấy condotel nào tại"} "${searchLocation}"`
              : t.condotel.noCondotels || "Chưa có condotel nào"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {condotels.map((condotel) => (
              <CondotelCard key={condotel.condotelId} data={condotel} />
            ))}
          </div>
          {condotels.length > 12 && (
            <div className="flex mt-16 justify-center items-center">
              <Pagination />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SectionGridFilterCard;
