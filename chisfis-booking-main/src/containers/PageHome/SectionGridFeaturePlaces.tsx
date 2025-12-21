import React, { FC, ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DEMO_STAY_LISTINGS } from "data/listings";
import { StayDataType } from "data/types";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import HeaderFilter from "./HeaderFilter";
import StayCard from "components/StayCard/StayCard";
import CondotelCard from "components/CondotelCard/CondotelCard";
import condotelAPI, { CondotelDTO } from "api/condotel";
import locationAPI, { LocationDTO } from "api/location";
import { useTranslation } from "i18n/LanguageContext";
import moment from "moment";

// OTHER DEMO WILL PASS PROPS
const DEMO_DATA: StayDataType[] = DEMO_STAY_LISTINGS.filter((_, i) => i < 8);

// Mock condotel data cho loading state
const MOCK_CONDOTEL_DATA: CondotelDTO = {
  condotelId: "mock-1",
  name: "Best Western Cedars Boutique Hotel",
  pricePerNight: 26,
  beds: 10,
  bathrooms: 4,
  status: "active",
  thumbnailUrl: "https://images.unsplash.com/photo-1566665556112-31771c3b37c9?w=800&h=600&fit=crop",
  resortName: "1 Anzinger Court",
  activePromotion: {
    promotionId: "promo-1",
    name: "Discount",
    discountPercentage: 10,
    discountAmount: 0,
    startDate: moment().toISOString(),
    endDate: moment().add(30, 'days').toISOString(),
    status: "active",
    isActive: true,
  },
  activePrice: null,
  reviewRate: 4.8,
  reviewCount: 28,
} as any;

const MOCK_CONDOTEL_DATA_2: CondotelDTO = {
  condotelId: "mock-2",
  name: "Bell By Greene King Inns",
  pricePerNight: 250,
  beds: 6,
  bathrooms: 3,
  status: "active",
  thumbnailUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop",
  resortName: "32923 Judy Hill",
  activePromotion: {
    promotionId: "promo-2",
    name: "Discount",
    discountPercentage: 10,
    discountAmount: 0,
    startDate: moment().toISOString(),
    endDate: moment().add(30, 'days').toISOString(),
    status: "active",
    isActive: true,
  },
  activePrice: null,
  reviewRate: 4.4,
  reviewCount: 198,
} as any;

const MOCK_CONDOTEL_DATA_3: CondotelDTO = {
  condotelId: "mock-3",
  name: "Half Moon, Sherborne By...",
  pricePerNight: 278,
  beds: 9,
  bathrooms: 5,
  status: "active",
  thumbnailUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
  resortName: "6731 Killdeer Park",
  activePromotion: null,
  activePrice: null,
  reviewRate: 3.6,
  reviewCount: 16,
} as any;

const MOCK_CONDOTEL_DATA_4: CondotelDTO = {
  condotelId: "mock-4",
  name: "White Horse Hotel By...",
  pricePerNight: 40,
  beds: 7,
  bathrooms: 3,
  status: "active",
  thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop",
  resortName: "35 Sherman Park",
  activePromotion: null,
  activePrice: null,
  reviewRate: 4.8,
  reviewCount: 34,
} as any;

//
export interface SectionGridFeaturePlacesProps {
  stayListings?: StayDataType[];
  gridClass?: string;
  heading?: ReactNode;
  subHeading?: ReactNode;
  headingIsCenter?: boolean;
  tabs?: string[];
}

const SectionGridFeaturePlaces: FC<SectionGridFeaturePlacesProps> = ({
  stayListings = DEMO_DATA,
  gridClass = "",
  heading,
  subHeading,
  headingIsCenter,
  tabs,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationTabs, setLocationTabs] = useState<string[]>([]);
  const [locationMap, setLocationMap] = useState<Map<string, number>>(new Map()); // Map location name to locationId
  const [activeTab, setActiveTab] = useState<string>("");
  const [apiSuccess, setApiSuccess] = useState(false); // Track if API loaded successfully

  // Use translations as defaults if not provided
  const displayHeading = heading || t.home.featuredPlaces;
  const displaySubHeading = subHeading || t.home.featuredPlacesSubtitle;

  // Load locations from API
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationsData = await locationAPI.getAllPublic();
        
        // Create tabs from location names
        const tabsList = locationsData.map(loc => loc.name || `Location ${loc.locationId}`).filter(name => name);
        setLocationTabs(tabsList.length > 0 ? tabsList : (tabs || [
          t.home.destinations.hanoi,
          t.home.destinations.hoChiMinh,
          t.home.destinations.daNang,
          t.home.destinations.haLong,
          t.home.destinations.hoiAn,
          t.home.destinations.nhaTrang,
        ]));
        
        // Create map from location name to locationId
        const map = new Map<string, number>();
        locationsData.forEach(loc => {
          const locationName = loc.name || `Location ${loc.locationId}`;
          if (locationName) {
            map.set(locationName, loc.locationId);
          }
        });
        setLocationMap(map);
        
        // Set first tab as active
        if (tabsList.length > 0) {
          setActiveTab(tabsList[0]);
        }
      } catch (err: any) {
        // Fallback to provided tabs or default translations
        const fallbackTabs = tabs || [
          t.home.destinations.hanoi,
          t.home.destinations.hoChiMinh,
          t.home.destinations.daNang,
          t.home.destinations.haLong,
          t.home.destinations.hoiAn,
          t.home.destinations.nhaTrang,
        ];
        setLocationTabs(fallbackTabs);
        if (fallbackTabs.length > 0) {
          setActiveTab(fallbackTabs[0]);
        }
      }
    };

    loadLocations();
  }, [tabs, t]);

  // Fetch condotels from API based on active tab
  useEffect(() => {
    const fetchCondotels = async () => {
      if (!activeTab) return;
      
      try {
        setLoading(true);
        setError("");
        setApiSuccess(false);
        
        // Get locationId from map if available
        const locationId = locationMap.get(activeTab);
        
        let data: CondotelDTO[];
        if (locationId) {
          // Filter by locationId
          data = await condotelAPI.getCondotelsByLocationId(locationId);
        } else {
          // Filter by location name
          data = await condotelAPI.getCondotelsByLocation(activeTab);
        }
        
        // Limit to 8 condotels for display
        setCondotels(data.slice(0, 8));
        setApiSuccess(true); // Mark API as successful
      } catch (err: any) {
        setError("Không có căn hộ"); // Show error message instead of trying to fetch again
        setCondotels([]); // Clear condotels so mock data won't show
        setApiSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCondotels();
  }, [activeTab, locationMap]);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  const handleViewAll = () => {
    const locationId = activeTab ? locationMap.get(activeTab) : null;
    if (locationId) {
      navigate(`/listing-stay?locationId=${locationId}`);
    } else {
      navigate("/listing-stay");
    }
  };

  const renderCard = (stay: StayDataType) => {
    return <StayCard key={stay.id} data={stay} />;
  };

  return (
    <div className="nc-SectionGridFeaturePlaces relative">
      <HeaderFilter
        tabActive={activeTab || locationTabs[0] || ""}
        subHeading={displaySubHeading}
        tabs={locationTabs}
        heading={displayHeading}
        onClickTab={handleTabClick}
        onViewAll={handleViewAll}
      />
      
      {error && (
        <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
          <p className="text-amber-900 dark:text-amber-100 text-lg font-semibold">
            {error}
          </p>
        </div>
      )}

      {loading || (!apiSuccess && error) ? (
        // Show mock data while loading or when API fails
        <>
          <div
            className={`grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gridClass}`}
          >
            <CondotelCard key="mock-1" />
            <CondotelCard key="mock-2" data={MOCK_CONDOTEL_DATA_2} />
            <CondotelCard key="mock-3" data={MOCK_CONDOTEL_DATA_3} />
            <CondotelCard key="mock-4" data={MOCK_CONDOTEL_DATA_4} />
          </div>
          <div className="flex mt-16 justify-center items-center">
            <ButtonPrimary onClick={handleViewAll}>
              {t.condotel.viewMore || "Xem thêm condotel"}
            </ButtonPrimary>
          </div>
        </>
      ) : apiSuccess && condotels.length > 0 ? (
        // Show real data from API when successful
        <>
          <div
            className={`grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gridClass}`}
          >
            {condotels.map((condotel) => (
              <CondotelCard key={condotel.condotelId} data={condotel} />
            ))}
          </div>
          <div className="flex mt-16 justify-center items-center">
            <ButtonPrimary onClick={handleViewAll}>
              {t.condotel.viewMore || "Xem thêm condotel"}
            </ButtonPrimary>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SectionGridFeaturePlaces;
