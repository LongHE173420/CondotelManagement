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
  const stateParams = (location.state as any)?.searchParams || {};
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [totalCondotels, setTotalCondotels] = useState(0); // Tổng số condotel
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  // Accept both ?name= and ?searchName= as the same filter
  const searchName = params.get("name") || params.get("searchName") || stateParams.name || stateParams.searchName;
  // Accept alternate keys for location
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

  // Reset page when search params change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchLocation, searchLocationId, searchHostId, searchFromDate, searchToDate, minPrice, maxPrice, beds, bathrooms]);

  // Fetch condotels when URL params or page change
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
        }
        
        // Host ID filter
        if (searchHostId) {
          const hostId = Number(searchHostId);
          if (!isNaN(hostId)) {
            searchQuery.hostId = hostId;
          }
        }
        
        // Location filters (can work together with name and dates)
        if (searchLocationId) {
          const locationId = Number(searchLocationId);
          if (!isNaN(locationId)) {
            searchQuery.locationId = locationId;
          }
        }
        if (searchLocation && searchLocation.trim()) {
          // Validate location is not a date format
          const locationValue = decodeURIComponent(searchLocation.trim());
          const isDate = /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(locationValue) || /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(locationValue);
          if (!isDate) {
            searchQuery.location = locationValue;
          }
        }
        
        // Date filters (can work with location and name)
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

        
        // Nếu có hostId, sử dụng API riêng để lấy condotels của host
        let results: CondotelDTO[] = [];
        if (searchHostId) {
          const hostId = Number(searchHostId);
          if (!isNaN(hostId)) {
            const hostResults = await condotelAPI.getCondotelsByHostId(hostId);
            results = Array.isArray(hostResults) ? hostResults : [];
          }
        } else {
          // Always fetch condotels - if no search params, get all condotels
          const searchResult = await condotelAPI.search(searchQuery);
          results = Array.isArray(searchResult) ? searchResult : [];
        }
        
        // Ensure we only set the results from the search, not all condotels
        // Ensure results is always an array
        if (!Array.isArray(results)) {
          results = [];
        }
        
        // Save total count before pagination
        setTotalCondotels(results.length);
        
        // Apply client-side pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedResults = results.slice(startIndex, endIndex);
        
        setCondotels(paginatedResults);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải danh sách condotel");
        setCondotels([]);
        setTotalCondotels(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCondotels();
  }, [location.search, searchName, searchLocation, searchLocationId, searchHostId, searchFromDate, searchToDate, minPrice, maxPrice, beds, bathrooms, currentPage]);

  const heading = searchLocation 
    ? `${t.condotel.staysIn || "Stays in"} ${searchLocation}`
    : t.condotel.allCondotels || "Tất cả Condotel";

  // Build subheading
  let subHeadingText = "";
  if (searchLocation) {
    subHeadingText = `${totalCondotels} ${t.condotel.list || "condotels"}`;
    if (searchFromDate && searchToDate) {
      const fromDate = moment(searchFromDate).format("MMM DD");
      const toDate = moment(searchToDate).format("MMM DD");
      subHeadingText += ` · ${fromDate} - ${toDate}`;
    }
    if (searchGuests) {
      subHeadingText += ` · ${searchGuests} ${t.booking.guests || "Guests"}`;
    }
  } else {
    subHeadingText = `${t.condotel.total || "Tổng cộng"}: ${totalCondotels} ${t.condotel.list || "condotel"}`;
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
          <div className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(condotels) && condotels.map((condotel) => (
              <CondotelCard key={condotel.condotelId} data={condotel} />
            ))}
          </div>
          {totalCondotels > itemsPerPage && (
            <div className="flex mt-16 justify-center items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                disabled={currentPage === 1}
                className={`inline-flex w-11 h-11 items-center justify-center rounded-full transition-colors ${
                  currentPage === 1
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600'
                    : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'
                }`}
              >
                ‹
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.ceil(totalCondotels / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`inline-flex w-11 h-11 items-center justify-center rounded-full transition-colors ${
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() => {
                  const totalPages = Math.ceil(totalCondotels / itemsPerPage);
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                disabled={currentPage === Math.ceil(totalCondotels / itemsPerPage)}
                className={`inline-flex w-11 h-11 items-center justify-center rounded-full transition-colors ${
                  currentPage === Math.ceil(totalCondotels / itemsPerPage)
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600'
                    : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'
                }`}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SectionGridFilterCard;
