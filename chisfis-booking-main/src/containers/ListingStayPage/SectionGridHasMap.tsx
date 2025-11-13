import React, { FC, useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import AnyReactComponent from "components/AnyReactComponent/AnyReactComponent";
import StayCardH from "components/StayCardH/StayCardH";
import GoogleMapReact from "google-map-react";
import { DEMO_STAY_LISTINGS } from "data/listings";
import { StayDataType } from "data/types";
import ButtonClose from "shared/ButtonClose/ButtonClose";
import Checkbox from "shared/Checkbox/Checkbox";
import Pagination from "shared/Pagination/Pagination";
import TabFilters from "./TabFilters";
import Heading2 from "components/Heading/Heading2";
import condotelAPI, { CondotelDTO } from "api/condotel";

const DEMO_STAYS = DEMO_STAY_LISTINGS.filter((_, i) => i < 12);

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
  const [currentHoverID, setCurrentHoverID] = useState<string | number>(-1);
  const [showFullMapFixed, setShowFullMapFixed] = useState(false);
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchLocation = params.get("location");

  useEffect(() => {
    const fetchCondotels = async () => {
      try {
        setLoading(true);
        setError("");
        
        if (searchLocation) {
          // Search by location
          const results = await condotelAPI.getCondotelsByLocationPublic(searchLocation);
          setCondotels(results);
        } else {
          // If no search params, load all condotels
          const results = await condotelAPI.getAll();
          setCondotels(results);
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
  }, [searchLocation]);

  // Convert condotels to StayDataType for display
  const stayListings: StayDataType[] = condotels.map(convertCondotelToStay);
  
  // Use first condotel's location or default Vietnam center for map center
  const mapCenter = stayListings.length > 0 
    ? stayListings[0].map 
    : DEFAULT_VIETNAM_CENTER;

  return (
    <div>
      <div className="relative flex min-h-screen">
        {/* CARDSSSS */}
        <div className="min-h-screen w-full xl:w-[780px] 2xl:w-[880px] flex-shrink-0 xl:px-8 ">
          <Heading2 />
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
