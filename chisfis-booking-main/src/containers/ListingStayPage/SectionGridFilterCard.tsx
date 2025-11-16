import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import StayCard from "components/StayCard/StayCard";
import { DEMO_STAY_LISTINGS } from "data/listings";
import { StayDataType } from "data/types";
import Pagination from "shared/Pagination/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "components/Heading/Heading2";
import { condotelAPI, CondotelDTO } from "api/condotel";
import CondotelCard from "components/CondotelCard/CondotelCard";
import { TaxonomyType } from "data/types";

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
  const location = useLocation();
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchLocation = params.get("location");
  const searchFromDate = params.get("startDate");
  const searchToDate = params.get("endDate");

  useEffect(() => {
    const fetchCondotels = async () => {
      try {
        setLoading(true);
        setError("");
        
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
        
        if (Object.keys(searchQuery).length > 0) {
          // Use new search API with all parameters
          const results = await condotelAPI.search(searchQuery);
          setCondotels(results);
        } else {
          // If no search params, show empty or use demo data
          setCondotels([]);
        }
      } catch (err: any) {
        console.error("Error fetching condotels:", err);
        setError(err.response?.data?.message || "Không thể tải danh sách condotel");
        setCondotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCondotels();
  }, [searchLocation, searchFromDate, searchToDate]);

  // Use condotels if available, otherwise use provided data or demo data
  const displayData = condotels.length > 0 
    ? condotels.map(convertCondotelToStay)
    : (data || DEMO_DATA);

  const heading = searchLocation 
    ? `Kết quả tìm kiếm: ${searchLocation}`
    : "Danh sách Condotel";

  return (
    <div
      className={`nc-SectionGridFilterCard ${className}`}
      data-nc-id="SectionGridFilterCard"
    >
      <Heading2 
        heading={heading}
        subHeading={searchLocation ? `Tìm thấy ${condotels.length} condotel` : undefined}
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
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : displayData.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-600 dark:text-neutral-400">
            {searchLocation 
              ? `Không tìm thấy condotel nào tại "${searchLocation}"`
              : "Chưa có condotel nào"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {condotels.length > 0 ? (
              // Render CondotelCard for API results
              condotels.map((condotel) => (
                <CondotelCard key={condotel.condotelId} data={condotel} />
              ))
            ) : (
              // Render StayCard for demo/default data
              displayData.map((stay) => (
                <StayCard key={stay.id} data={stay} />
              ))
            )}
          </div>
          <div className="flex mt-16 justify-center items-center">
            <Pagination />
          </div>
        </>
      )}
    </div>
  );
};

export default SectionGridFilterCard;
