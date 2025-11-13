import React, { FC, ReactNode, useState, useEffect } from "react";
import { DEMO_STAY_LISTINGS } from "data/listings";
import { StayDataType } from "data/types";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import HeaderFilter from "./HeaderFilter";
import StayCard from "components/StayCard/StayCard";
import CondotelCard from "components/CondotelCard/CondotelCard";
import condotelAPI, { CondotelDTO } from "api/condotel";
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
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Use translations as defaults if not provided
  const displayHeading = heading || t.home.featuredPlaces;
  const displaySubHeading = subHeading || t.home.featuredPlacesSubtitle;
  const displayTabs = tabs || ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hạ Long", "Hội An", "Nha Trang"];

  // Fetch condotels from API
  useEffect(() => {
    const fetchCondotels = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await condotelAPI.getAll();
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
  }, []);

  const renderCard = (stay: StayDataType) => {
    return <StayCard key={stay.id} data={stay} />;
  };

  return (
    <div className="nc-SectionGridFeaturePlaces relative">
      <HeaderFilter
        tabActive={displayTabs[0]}
        subHeading={displaySubHeading}
        tabs={displayTabs}
        heading={displayHeading}
        onClickTab={() => {}}
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
            <ButtonPrimary href="/listing-stay">Xem thêm condotel</ButtonPrimary>
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
            <ButtonPrimary loading>Show me more</ButtonPrimary>
          </div>
        </>
      )}
    </div>
  );
};

export default SectionGridFeaturePlaces;
