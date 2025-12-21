import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import AnyReactComponent from "components/AnyReactComponent/AnyReactComponent";
import StayCardH from "components/StayCardH/StayCardH";
import GoogleMapReact from "google-map-react";
import { StayDataType } from "data/types";
import ButtonClose from "shared/ButtonClose/ButtonClose";
import Checkbox from "shared/Checkbox/Checkbox";
import Pagination from "shared/Pagination/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "components/Heading/Heading2";
import condotelAPI, { CondotelDTO } from "api/condotel";
import { useTranslation } from "i18n/LanguageContext";
import moment from "moment";
import { toastError } from "utils/toast";

// Default coordinates for Vietnam (center of Vietnam)
const DEFAULT_VIETNAM_CENTER = {
  lat: 14.0583,
  lng: 108.2772,
};

// Helper function to convert CondotelDTO to StayDataType for map display
const convertCondotelToStay = (condotel: CondotelDTO): StayDataType => {
  // Default coordinates - có thể cải thiện bằng cách lấy từ resort location nếu có
  const defaultMap = DEFAULT_VIETNAM_CENTER;
  
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
    map: defaultMap,
  };
};

export interface SectionGridHasMapProps {}

const SectionGridHasMap: FC<SectionGridHasMapProps> = () => {
  const location = useLocation();
  const stateParams = (location.state as any)?.searchParams || {};
  const [currentHoverID, setCurrentHoverID] = useState<string | number>(-1);
  const [showFullMapFixed, setShowFullMapFixed] = useState(false);
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    // Use window.location.search as fallback if React Router location.search is empty
    const searchString = location.search || window.location.search;
    const urlParams = new URLSearchParams(searchString);
    return urlParams;
  }, [location.search]);
  
  // Get location param - validate it's not a date format
  // URLSearchParams.get() only returns the FIRST value if there are multiple params with same name
  // So we need to check all location params
  let searchLocation: string | null = null;

  // Get all location params (if URL has multiple location params)
  const allLocationParams: string[] = [];
  params.forEach((value, key) => {
    if (key === "location" || key === "searchLocation" || key === "locationName" || key === "city") {
      allLocationParams.push(value);
    }
  });
  if (stateParams.location || stateParams.searchLocation || stateParams.locationName || stateParams.city) {
    const stateLoc =
      stateParams.location || stateParams.searchLocation || stateParams.locationName || stateParams.city;
    allLocationParams.push(stateLoc);
  }
  
  // Find the first location that is NOT a date format
  for (const loc of allLocationParams) {
    // Check if it looks like a date (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.)
    const isDate = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(loc) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(loc);
    if (!isDate && loc.trim().length > 0) {
      searchLocation = loc.trim();
      break;
    }
  }
  
  // Fallback: if no valid location found, try params.get() (gets first value)
  if (!searchLocation) {
    const firstLocation =
      params.get("location") ||
      params.get("searchLocation") ||
      params.get("locationName") ||
      params.get("city");
    if (firstLocation && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(firstLocation) && !/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(firstLocation)) {
      searchLocation = firstLocation.trim();
    }
  }
  
  // Accept both ?name= and ?searchName= as the same filter (fallback to navigation state)
  const searchName = params.get("name") || params.get("searchName") || stateParams.name || stateParams.searchName;
  // Accept alternate keys for locationId (fallback to navigation state)
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

  // Fetch condotels when URL params change
  useEffect(() => {
    const fetchCondotels = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Build search query
        const searchQuery: any = {};
        
        // Name filter (highest priority for search)
        const searchName = params.get("name");
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
          const isDate = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(locationValue) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(locationValue);
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
            results = await condotelAPI.getCondotelsByHostId(hostId);
          }
        } else {
          const searchResult = await condotelAPI.search(searchQuery);
          results = Array.isArray(searchResult) ? searchResult : [];
        }
        
        setCondotels(results);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải danh sách condotel");
        setCondotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCondotels();
  }, [location.search, searchLocation, searchLocationId, searchHostId, searchFromDate, searchToDate, searchName, minPrice, maxPrice, beds, bathrooms]);

  // Convert condotels to StayDataType for display
  const stayListings: StayDataType[] = condotels.map(convertCondotelToStay);
  
  // Use first condotel's location or default Vietnam center for map center
  const mapCenter = stayListings.length > 0 
    ? stayListings[0].map 
    : DEFAULT_VIETNAM_CENTER;

  // Build heading and subheading
  const { t } = useTranslation();
  const heading = searchLocation 
    ? `${t.condotel.staysIn || "Stays in"} ${searchLocation}`
    : t.condotel.allCondotels || "Tất cả Condotel";

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
    <div>
      <div className="relative flex min-h-screen">
        {/* CARDSSSS */}
        <div className="min-h-screen w-full xl:w-[780px] 2xl:w-[880px] flex-shrink-0 xl:px-8 ">
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
            </div>
          ) : stayListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-8">
                {stayListings.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setCurrentHoverID((_) => item.id)}
                    onMouseLeave={() => setCurrentHoverID((_) => -1)}
                  >
                    <StayCardH data={item} />
                  </div>
                ))}
              </div>
              <div className="flex mt-16 justify-center items-center">
                <Pagination />
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-neutral-500 dark:text-neutral-400">
              {searchLocation 
                ? `Không tìm thấy condotel nào tại "${searchLocation}"`
                : "Chưa có condotel nào"}
            </div>
          )}
        </div>

        {!showFullMapFixed && (
          <div
            className="flex xl:hidden items-center justify-center fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-neutral-900 text-white shadow-2xl rounded-full z-30  space-x-3 text-sm cursor-pointer"
            onClick={() => setShowFullMapFixed(true)}
          >
            <i className="text-lg las la-map"></i>
            <span>Show map</span>
          </div>
        )}

        {/* MAPPPPP */}
        <div
          className={`xl:flex-grow xl:static xl:block ${
            showFullMapFixed ? "fixed inset-0 z-50" : "hidden"
          }`}
        >
          {showFullMapFixed && (
            <ButtonClose
              onClick={() => setShowFullMapFixed(false)}
              className="bg-white absolute z-50 left-3 top-3 shadow-lg rounded-xl w-10 h-10"
            />
          )}

          <div className="fixed xl:sticky top-0 xl:top-[88px] left-0 w-full h-full xl:h-[calc(100vh-88px)] rounded-md overflow-hidden">
            <div className="absolute bottom-5 left-3 lg:bottom-auto lg:top-2.5 lg:left-1/2 transform lg:-translate-x-1/2 py-2 px-4 bg-white dark:bg-neutral-800 shadow-xl z-10 rounded-2xl min-w-max">
              <Checkbox
                className="text-xs xl:text-sm"
                name="xx"
                label="Search as I move the map"
              />
            </div>

            {/* BELLOW IS MY GOOGLE API KEY -- PLEASE DELETE AND TYPE YOUR API KEY */}
            <GoogleMapReact
              defaultZoom={12}
              defaultCenter={mapCenter}
              bootstrapURLKeys={{
                key: "AIzaSyAGVJfZMAKYfZ71nzL_v5i3LjTTWnCYwTY",
              }}
              yesIWantToUseGoogleMapApiInternals
            >
              {stayListings.map((item) => (
                <AnyReactComponent
                  isSelected={currentHoverID === item.id}
                  key={item.id}
                  lat={item.map.lat}
                  lng={item.map.lng}
                  listing={item}
                />
              ))}
            </GoogleMapReact>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionGridHasMap;
