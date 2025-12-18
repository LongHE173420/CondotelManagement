import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Pagination from "shared/Pagination/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "components/Heading/Heading2";
import { condotelAPI, CondotelDTO } from "api/condotel";
import CondotelCard from "components/CondotelCard/CondotelCard";
import { useTranslation } from "i18n/LanguageContext";
import moment from "moment";

export interface SectionGridFilterCardProps {
  className?: string;
  data?: any[];
}

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
  const searchName = params.get("name");
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

  // Fetch condotels when URL params change
  useEffect(() => {
    const fetchCondotels = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Build search query
        const searchQuery: any = {};
        
        // Name filter (highest priority for search)
        if (searchName && searchName.trim()) {
          searchQuery.name = searchName.trim();
          console.log("🔍 Searching with name:", searchName.trim());
        }
        
        // Host ID filter
        if (searchHostId) {
          const hostId = Number(searchHostId);
          if (!isNaN(hostId)) {
            searchQuery.hostId = hostId;
            console.log("🔍 Searching with hostId:", hostId);
          }
        }
        
        // Location filters (can work together with name and dates)
        if (searchLocationId) {
          const locationId = Number(searchLocationId);
          if (!isNaN(locationId)) {
            searchQuery.locationId = locationId;
            console.log("🔍 Searching with locationId:", locationId);
          }
        }
        if (searchLocation && searchLocation.trim()) {
          // Validate location is not a date format
          const locationValue = decodeURIComponent(searchLocation.trim());
          const isDate = /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(locationValue) || /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(locationValue);
          if (!isDate) {
            searchQuery.location = locationValue;
            console.log("🔍 Searching with location:", locationValue);
          }
        }
        
        // Date filters (can work with location and name)
        if (searchFromDate) {
          searchQuery.fromDate = searchFromDate;
          console.log("🔍 Searching with fromDate:", searchFromDate);
        }
        if (searchToDate) {
          searchQuery.toDate = searchToDate;
          console.log("🔍 Searching with toDate:", searchToDate);
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
          searchName,
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
            const hostResults = await condotelAPI.getCondotelsByHostId(hostId);
            results = Array.isArray(hostResults) ? hostResults : [];
            console.log("✅ Loaded condotels for host:", results.length);
          }
        } else {
          // Always fetch condotels - if no search params, get all condotels
          const searchResult = await condotelAPI.search(searchQuery);
          results = Array.isArray(searchResult?.data) ? searchResult.data : [];
          console.log("✅ Search results:", results.length, "condotels found");
        }
        
        console.log("✅ Results:", results);
        console.log("✅ Results is array:", Array.isArray(results));
        
        // Ensure we only set the results from the search, not all condotels
        // Ensure results is always an array
        if (!Array.isArray(results)) {
          console.error("❌ Results is not an array:", results);
          results = [];
        }
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
  }, [location.search, searchName, searchLocation, searchLocationId, searchHostId, searchFromDate, searchToDate, minPrice, maxPrice, beds, bathrooms]);

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
      ) : !Array.isArray(condotels) || condotels.length === 0 ? (
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
            {Array.isArray(condotels) && condotels.map((condotel) => (
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
