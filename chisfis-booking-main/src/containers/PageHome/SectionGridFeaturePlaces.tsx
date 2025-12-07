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

// OTHER DEMO WILL PASS PROPS
const DEMO_DATA: StayDataType[] = DEMO_STAY_LISTINGS.filter((_, i) => i < 8);

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

  // Use translations as defaults if not provided
  const displayHeading = heading || t.home.featuredPlaces;
  const displaySubHeading = subHeading || t.home.featuredPlacesSubtitle;

  // Load locations from API
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationsData = await locationAPI.getAllPublic();
        
        // Create tabs from location names
        const tabsList = locationsData.map(loc => loc.locationName);
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
          map.set(loc.locationName, loc.locationId);
        });
        setLocationMap(map);
        
        // Set first tab as active
        if (tabsList.length > 0) {
          setActiveTab(tabsList[0]);
        }
      } catch (err: any) {
        console.error("Error loading locations:", err);
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
      } catch (err: any) {
        console.error("Error fetching condotels:", err);
        setError("Không thể tải danh sách condotel");
        // Fallback to demo data on error
        setCondotels([]);
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
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : condotels.length > 0 ? (
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
      ) : (
        <>
          <div
            className={`grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gridClass}`}
          >
            {DEMO_DATA.map((stay) => renderCard(stay))}
          </div>
          <div className="flex mt-16 justify-center items-center">
            <ButtonPrimary onClick={handleViewAll}>
              {t.condotel.viewMore || "Xem thêm condotel"}
            </ButtonPrimary>
          </div>
        </>
      )}
    </div>
  );
};

export default SectionGridFeaturePlaces;
