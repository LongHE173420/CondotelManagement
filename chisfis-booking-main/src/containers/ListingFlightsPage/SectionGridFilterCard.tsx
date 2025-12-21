import React, { FC, useEffect, useMemo, useState } from "react";
import TabFilters from "./TabFilters";
import Heading2 from "components/Heading/Heading2";
import FlightCard, { FlightCardProps } from "components/FlightCard/FlightCard";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { useLocation } from "react-router-dom";
import flightsAPI, { FlightSearchParams, FlightSearchResultItem } from "api/flights";

export interface SectionGridFilterCardProps {
  className?: string;
}

const VN_DEMO: Record<string, FlightSearchResultItem[]> = {
  "Hà Nội (HAN)|TP. Hồ Chí Minh (SGN)": [
    { id: "VN-1", airlines: { logo: "https://www.gstatic.com/flights/airline_logos/70px/VN.png", name: "Vietnam Airlines" }, price: "1,500,000đ" },
    { id: "VJ-2", airlines: { logo: "https://www.gstatic.com/flights/airline_logos/70px/VJ.png", name: "Vietjet Air" }, price: "990,000đ" },
    { id: "QH-3", airlines: { logo: "https://www.gstatic.com/flights/airline_logos/70px/QH.png", name: "Bamboo Airways" }, price: "1,250,000đ" },
  ],
  "TP. Hồ Chí Minh (SGN)|Đà Nẵng (DAD)": [
    { id: "VN-4", airlines: { logo: "https://www.gstatic.com/flights/airline_logos/70px/VN.png", name: "Vietnam Airlines" }, price: "1,200,000đ" },
    { id: "VJ-5", airlines: { logo: "https://www.gstatic.com/flights/airline_logos/70px/VJ.png", name: "Vietjet Air" }, price: "850,000đ" },
  ],
  "Hà Nội (HAN)|Đà Nẵng (DAD)": [
    { id: "VN-6", airlines: { logo: "https://www.gstatic.com/flights/airline_logos/70px/VN.png", name: "Vietnam Airlines" }, price: "1,100,000đ" },
    { id: "QH-7", airlines: { logo: "https://www.gstatic.com/flights/airline_logos/70px/QH.png", name: "Bamboo Airways" }, price: "980,000đ" },
  ],
  "Hà Nội (HAN)|Nha Trang (CXR)": [
    { id: "VN-8", airlines: { logo: "https://www.gstatic.com/flights/airline_logos/70px/VN.png", name: "Vietnam Airlines" }, price: "1,300,000đ" },
  ],
};

const SectionGridFilterCard: FC<SectionGridFilterCardProps> = ({ className = "" }) => {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [items, setItems] = useState<FlightSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const query: FlightSearchParams = {
    from: params.get("from") || "",
    to: params.get("to") || "",
    startDate: params.get("startDate") || undefined,
    endDate: params.get("endDate") || undefined,
    guests: params.get("guests") ? Number(params.get("guests")) : undefined,
    flightClass: params.get("class") || undefined,
    tripType: (params.get("tripType") as any) || undefined,
  };

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        const data = await flightsAPI.search(query);
        if (data && data.length) {
          setItems(data);
        } else {
          // Fallback VN demo
          const key = `${query.from}|${query.to}`;
          setItems(VN_DEMO[key] || []);
        }
      } catch {
        const key = `${query.from}|${query.to}`;
        setItems(VN_DEMO[key] || []);
      } finally {
        setLoading(false);
      }
    };
    fetchFlights();
  }, [location.search]);

  const heading = `${query.from || "Điểm đi"} - ${query.to || "Điểm đến"}`;
  const subHeading = (
    <span className="block text-neutral-500 dark:text-neutral-400 mt-3">
      {items.length} flights
      {query.tripType ? <><span className="mx-2">·</span>{query.tripType}</> : null}
      {query.guests ? <><span className="mx-2">·</span>{query.guests} Guests</> : null}
    </span>
  );

  return (
    <div className={`nc-SectionGridFilterCard ${className}`} data-nc-id="SectionGridFilterCard">
      <Heading2 heading={heading} subHeading={subHeading} />
      <div className="mb-8 lg:mb-11">
        <TabFilters />
      </div>
      <div className="lg:p-10 lg:bg-neutral-50 lg:dark:bg-black/20 grid grid-cols-1 gap-6  rounded-3xl">
        {loading ? (
          <div className="py-10 text-center">Đang tải...</div>
        ) : items.length ? (
          items.map((item, index) => <FlightCard key={index} data={item as unknown as FlightCardProps["data"]} />)
        ) : (
          <div className="py-10 text-center">Không tìm thấy chuyến bay phù hợp</div>
        )}
        <div className="flex mt-12 justify-center items-center">
          <ButtonPrimary disabled loading={loading}>Show more</ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

export default SectionGridFilterCard;
