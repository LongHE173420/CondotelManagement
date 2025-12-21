import React, { useState, useEffect } from "react";
import RentalCarDatesRangeInput from "./RentalCarDatesRangeInput";
import { FC } from "react";
import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Fragment } from "react";
import moment from "moment";
import NcInputNumber from "components/NcInputNumber/NcInputNumber";
import { useNavigate } from "react-router-dom";
import locationAPI from "api/location";

export interface DateRage {
  startDate: moment.Moment | null;
  endDate: moment.Moment | null;
}

export interface TimeRage {
  startTime: string;
  endTime: string;
}

export interface FlightSearchFormProps {
  haveDefaultValue?: boolean;
}

// Các sân bay lớn VN
const LOCATIONS_VN = [
  { label: "Hà Nội (HAN)", value: "Hà Nội (HAN)" },
  { label: "TP. Hồ Chí Minh (SGN)", value: "TP. Hồ Chí Minh (SGN)" },
  { label: "Đà Nẵng (DAD)", value: "Đà Nẵng (DAD)" },
  { label: "Nha Trang (CXR)", value: "Nha Trang (CXR)" },
  { label: "Huế (HUI)", value: "Huế (HUI)" },
  { label: "Cần Thơ (VCA)", value: "Cần Thơ (VCA)" },
  { label: "Vinh (VII)", value: "Vinh (VII)" },
  { label: "Phú Quốc (PQC)", value: "Phú Quốc (PQC)" },
  { label: "Đà Lạt (DLI)", value: "Đà Lạt (DLI)" },
];

const flightClass = [
  { name: "Economy", href: "##" },
  { name: "Business", href: "##" },
  { name: "Multiple", href: "##" },
];

const FlightSearchForm: FC<FlightSearchFormProps> = ({ haveDefaultValue }) => {
  const navigate = useNavigate();
  const [allLocations, setAllLocations] = useState<Array<{ label: string; value: string }>>([]);
  const defaultPickUpInputValue = "Hà Nội (HAN)";
  const defaultDropOffInputValue = "TP. Hồ Chí Minh (SGN)";

  const [dateRangeValue, setDateRangeValue] = useState<DateRage>({ startDate: null, endDate: null });
  const [timeRangeValue, setTimeRangeValue] = useState<TimeRage>({ startTime: "10:00 AM", endTime: "10:00 AM" });
  const [pickUpInputValue, setPickUpInputValue] = useState(defaultPickUpInputValue);
  const [dropOffInputValue, setDropOffInputValue] = useState(defaultDropOffInputValue);
  const [dropOffLocationType, setDropOffLocationType] = useState<"roundTrip" | "oneWay" | "">("roundTrip");
  const [guests, setGuests] = useState(1);
  const [flightClassState, setFlightClassState] = useState("Economy");

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locations = await locationAPI.getAllPublic();
        const locationOptions = locations.map(loc => ({
          label: loc.name,
          value: loc.name,
        }));
        setAllLocations(locationOptions);
      } catch (err) {
        setAllLocations(LOCATIONS_VN);
      }
    };
    loadLocations();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (pickUpInputValue) params.set("from", pickUpInputValue);
    if (dropOffInputValue) params.set("to", dropOffInputValue);
    if (dateRangeValue.startDate) params.set("startDate", dateRangeValue.startDate.format("YYYY-MM-DD"));
    if (dateRangeValue.endDate) params.set("endDate", dateRangeValue.endDate.format("YYYY-MM-DD"));
    params.set("guests", String(guests));
    params.set("class", flightClassState);
    params.set("tripType", dropOffLocationType || "roundTrip");
    navigate(`/listing-flights?${params.toString()}`);
  };

  const renderGuest = () => {
    return (
      <div className="">
        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button className="px-4 py-1.5 rounded-md inline-flex items-center font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-0 text-xs" onClick={() => { ((document.querySelector("#nc-site-header") as HTMLElement) || null)?.click(); }}>
                <span>{`${guests} Guest`}</span>
                <ChevronDownIcon className={`${open ? "" : "text-opacity-70"} ml-2 h-4 w-4 group-hover:text-opacity-80 transition ease-in-out duration-150`} aria-hidden="true" />
              </Popover.Button>
              <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
                <Popover.Panel className="absolute z-30 px-4 mt-3 transform -translate-x-1/2 left-1/2 sm:px-0 ">
                  <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                    <div className="relative bg-white dark:bg-neutral-800 p-4">
                      <NcInputNumber onChange={(e) => setGuests(e)} min={1} defaultValue={guests} max={20} />
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    );
  };

  const renderSelectClass = () => {
    return (
      <div className="">
        <Popover className="relative">
          {({ open, close }) => (
            <>
              <Popover.Button className="px-4 py-1.5 rounded-md inline-flex items-center font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-0 text-xs" onClick={() => { ((document.querySelector("#nc-site-header") as HTMLElement) || null)?.click(); }}>
                <span>{`${flightClassState}`}</span>
                <ChevronDownIcon className={`${open ? "" : "text-opacity-70"} ml-2 h-4 w-4 group-hover:text-opacity-80 transition ease-in-out duration-150`} aria-hidden="true" />
              </Popover.Button>
              <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
                <Popover.Panel className="absolute z-30 w-screen max-w-[200px] sm:max-w-[220px] px-4 mt-3 transform -translate-x-1/2 left-1/2 sm:px-0 ">
                  <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 ">
                    <div className="relative grid bg-white dark:bg-neutral-800 p-3">
                      {flightClass.map((item) => (
                        <a key={item.name} href={item.href} onClick={(e) => { e.preventDefault(); setFlightClassState(item.name); close(); }} className="flex items-center p-2 transition duration-150 ease-in-out rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50">
                          <p className="text-sm font-medium ">{item.name}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    );
  };

  const renderRadioBtn = () => (
    <div className="pb-3 flex justify-center space-x-3">
      <div className={`py-1.5 px-4 flex items-center rounded-full font-medium text-xs cursor-pointer select-none ${dropOffLocationType === "roundTrip" ? "bg-black shadow-black/10 shadow-lg text-white" : "border border-neutral-300 dark:border-neutral-700"}`} onClick={() => setDropOffLocationType("roundTrip")}>Khứ hồi</div>
      <div className={`py-1.5 px-4 flex items-center rounded-full font-medium text-xs cursor-pointer select-none ${dropOffLocationType === "oneWay" ? "bg-black text-white shadow-black/10 shadow-lg" : "border border-neutral-300 dark:border-neutral-700"}`} onClick={() => setDropOffLocationType("oneWay")}>Một chiều</div>
      <div className="border border-neutral-300 dark:border-neutral-700 rounded-full">{renderSelectClass()}</div>
      <div className="border border-neutral-300 dark:border-neutral-700 rounded-full">{renderGuest()}</div>
    </div>
  );

  const renderForm = () => (
    <form className="w-full relative " onSubmit={handleSubmit}>
      {renderRadioBtn()}
      <div className=" flex w-full rounded-full border border-neutral-200 dark:border-neutral-700 gap-3 p-2">
        <select
          value={pickUpInputValue}
          onChange={e => setPickUpInputValue(e.target.value)}
          className="w-1/2 rounded-md p-2 border border-neutral-300"
        >
          <option value="">Chọn điểm đi</option>
          {(allLocations.length > 0 ? allLocations : LOCATIONS_VN).map(loc => <option value={loc.value} key={loc.value}>{loc.label}</option>)}
        </select>
        <select
          value={dropOffInputValue}
          onChange={e => setDropOffInputValue(e.target.value)}
          className="w-1/2 rounded-md p-2 border border-neutral-300"
        >
          <option value="">Chọn điểm đến</option>
          {(allLocations.length > 0 ? allLocations : LOCATIONS_VN).map(loc => <option value={loc.value} key={loc.value}>{loc.label}</option>)}
        </select>
        <RentalCarDatesRangeInput
          defaultDateValue={dateRangeValue}
          defaultTimeValue={timeRangeValue}
          defaultFocus={null}
          onFocusChange={() => {}}
          onChange={(data) => { setDateRangeValue(data.stateDate); setTimeRangeValue(data.stateTimeRage); }}
          className="flex-1"
        />
      </div>
      <div className="flex justify-center mt-3">
        <button type="submit" className="px-5 py-2 rounded-full bg-primary-6000 text-white text-sm font-medium">Tìm chuyến bay</button>
      </div>
    </form>
  );

  return renderForm();
};

export default FlightSearchForm;
