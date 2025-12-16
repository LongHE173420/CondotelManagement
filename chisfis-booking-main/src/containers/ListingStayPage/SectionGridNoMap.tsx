import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StayCardH from "components/StayCardH/StayCardH";
import { StayDataType } from "data/types";
import TabFilters from "./TabFilters";
import Heading2 from "components/Heading/Heading2";
import condotelAPI, { CondotelDTO, PagedResult } from "api/condotel";
import moment from "moment";

// Helper function to convert CondotelDTO to StayDataType for display
const convertCondotelToStay = (condotel: CondotelDTO): StayDataType => {
  return {
    id: condotel.condotelId.toString(),
    author: {
      id: "1",
      firstName: condotel.hostName || "Chủ nhà",
      lastName: "",
      displayName: condotel.hostName || "Chủ nhà",
      avatar: "",
      count: 0,
      desc: "",
      jobName: "Chủ nhà",
      href: "/",
    },
    date: new Date().toISOString(),
    href: `/listing-stay-detail/${condotel.condotelId}`,
    title: condotel.name,
    featuredImage: condotel.thumbnailUrl || "/images/placeholder.png",
    galleryImgs: condotel.thumbnailUrl ? [condotel.thumbnailUrl] : [],
    commentCount: condotel.reviewCount || 0,
    viewCount: 0,
    like: false,
    address: condotel.resortName || "",
    reviewStart: condotel.reviewRate || 0,
    reviewCount: condotel.reviewCount || 0,
    price: (condotel.pricePerNight || 0).toString(),
    listingCategory: {
      id: "condotel",
      name: "Condotel",
      href: "/listing-stay",
      taxonomy: "category",
    },
    maxGuests: condotel.beds || 0,
    bedrooms: condotel.beds || 0,
    bathrooms: condotel.bathrooms || 0,
    saleOff: undefined,
    isAds: false,
    map: { lat: 0, lng: 0 },
  };
};

export interface SectionGridNoMapProps {}

const SectionGridNoMap: FC<SectionGridNoMapProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<{
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const params = useMemo(() => {
    const searchString = location.search || window.location.search;
    const urlParams = new URLSearchParams(searchString);
    return urlParams;
  }, [location.search]);
  
  // Get location param
  let searchLocation: string | null = null;
  const allLocationParams: string[] = [];
  params.forEach((value, key) => {
    if (key === "location") {
      allLocationParams.push(value);
    }
  });
  
  for (const loc of allLocationParams) {
    const isDate = /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(loc) || /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(loc);
    if (!isDate && loc.trim().length > 0) {
      searchLocation = loc.trim();
      break;
    }
  }
  
  if (!searchLocation) {
    const firstLocation = params.get("location");
    if (firstLocation && !/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(firstLocation) && !/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(firstLocation)) {
      searchLocation = firstLocation.trim();
    }
  }
  
  const searchName = params.get("name");
  const searchLocationId = params.get("locationId");
  const searchHostId = params.get("hostId");
  const searchFromDate = params.get("startDate");
  const searchToDate = params.get("endDate");
  const searchGuests = params.get("guests");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const beds = params.get("beds");
  const bathrooms = params.get("bathrooms");
  const pageParam = params.get("page");

  // Update current page from URL
  useEffect(() => {
    if (pageParam) {
      const page = Number(pageParam);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    } else {
      setCurrentPage(1);
    }
  }, [pageParam]);

  // Fetch condotels when URL params change
  useEffect(() => {
    const fetchCondotels = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Build search query
        const searchQuery: any = {
          pageNumber: currentPage,
          pageSize: 5, // 5 items per page
        };
        
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
        
        // Call API with pagination
        let result: PagedResult<CondotelDTO>;
        if (searchHostId) {
          const hostId = Number(searchHostId);
          if (!isNaN(hostId)) {
            // For host-specific search, use regular search API with hostId
            result = await condotelAPI.search(searchQuery);
          } else {
            result = await condotelAPI.search(searchQuery);
          }
        } else {
          result = await condotelAPI.search(searchQuery);
        }
        
        setCondotels(result.data);
        setPagination(result.pagination);
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách condotel:", err);
        setError(err.response?.data?.message || "Không thể tải danh sách condotel");
        setCondotels([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCondotels();
  }, [location.search, currentPage, searchName, searchLocation, searchLocationId, searchHostId, searchFromDate, searchToDate, minPrice, maxPrice, beds, bathrooms]);

  // Convert condotels to StayDataType for display
  const stayListings: StayDataType[] = condotels.map(convertCondotelToStay);

  // Build heading and subheading
  const heading = searchLocation 
    ? `Căn hộ tại ${searchLocation}`
    : "Tất cả Condotel";

  let subHeadingText = "";
  if (pagination) {
    subHeadingText = `Hiển thị ${condotels.length} trong tổng số ${pagination.totalCount} căn hộ`;
    if (searchFromDate && searchToDate) {
      const fromDate = moment(searchFromDate).format("DD/MM/YYYY");
      const toDate = moment(searchToDate).format("DD/MM/YYYY");
      subHeadingText += ` · ${fromDate} - ${toDate}`;
    }
    if (searchGuests) {
      subHeadingText += ` · ${searchGuests} khách`;
    }
  } else {
    subHeadingText = `Tổng cộng: ${condotels.length} căn hộ`;
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL without reload
    const newParams = new URLSearchParams(location.search);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="relative">
        {/* CARDS */}
        <div className="w-full">
          <Heading2 heading={heading} subHeading={subHeadingText} />
          <div className="mb-8 lg:mb-11">
            <TabFilters />
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <span className="ml-4 text-neutral-600 dark:text-neutral-400">Đang tải...</span>
            </div>
          ) : stayListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-8">
                {stayListings.map((item) => (
                  <div key={item.id}>
                    <StayCardH data={item} />
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex mt-16 justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      pagination.hasPreviousPage
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    Trước
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-11 h-11 rounded-full font-medium ${
                              page === currentPage
                                ? "bg-primary-600 text-white"
                                : "bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 dark:text-neutral-400 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:border-neutral-700"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-neutral-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      pagination.hasNextPage
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    Sau
                  </button>
                  
                  <span className="ml-4 text-sm text-neutral-600 dark:text-neutral-400">
                    Trang {currentPage} / {pagination.totalPages}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-neutral-500 dark:text-neutral-400">
              {searchLocation 
                ? `Không tìm thấy căn hộ nào tại "${searchLocation}"`
                : "Chưa có căn hộ nào"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionGridNoMap;

