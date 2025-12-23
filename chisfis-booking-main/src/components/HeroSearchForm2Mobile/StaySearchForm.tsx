import { DateRage } from "components/HeroSearchForm/StaySearchForm";
import React, { useState } from "react";
import LocationInput from "./LocationInput";
import StayDatesRangeInput from "./StayDatesRangeInput";

const StaySearchForm = () => {
  //
  const [fieldNameShow, setFieldNameShow] = useState<
    "location" | "dates"
  >("location");
  //
  const [locationInputTo, setLocationInputTo] = useState("");
  const [dateRangeValue, setDateRangeValue] = useState<DateRage>({
    startDate: null,
    endDate: null,
  });

  const renderInputLocation = () => {
    const isActive = fieldNameShow === "location";
    return (
      <div
        className={`w-full bg-white dark:bg-neutral-800 ${
          isActive
            ? "rounded-2xl shadow-lg"
            : "rounded-xl shadow-[0px_2px_2px_0px_rgba(0,0,0,0.25)]"
        }`}
      >
        {!isActive ? (
          <button
            className={`w-full flex justify-between text-sm font-medium p-4`}
            onClick={() => setFieldNameShow("location")}
          >
            <span className="text-neutral-400">Where</span>
            <span>{locationInputTo || "Location"}</span>
          </button>
        ) : (
          <LocationInput
            defaultValue={locationInputTo}
            onChange={(value) => {
              setLocationInputTo(value);
              setFieldNameShow("dates");
            }}
          />
        )}
      </div>
    );
  };

  const renderInputDates = () => {
    const isActive = fieldNameShow === "dates";
    const startDateString = dateRangeValue.startDate?.format("MMM DD");
    const endDateString =
      dateRangeValue.endDate?.get("month") !==
      dateRangeValue.startDate?.get("month")
        ? dateRangeValue.endDate?.format("MMM DD")
        : dateRangeValue.endDate?.format("DD");
    const dateSelected =
      startDateString && endDateString
        ? `${startDateString} - ${endDateString}`
        : `${startDateString || endDateString || ""}`;
    return (
      <div
        className={`w-full bg-white dark:bg-neutral-800 overflow-hidden ${
          isActive
            ? "rounded-2xl shadow-lg"
            : "rounded-xl shadow-[0px_2px_2px_0px_rgba(0,0,0,0.25)]"
        }`}
      >
        {!isActive ? (
          <button
            className={`w-full flex justify-between text-sm font-medium p-4  `}
            onClick={() => setFieldNameShow("dates")}
          >
            <span className="text-neutral-400">When</span>
            <span>{dateSelected || "Add date"}</span>
          </button>
        ) : (
          <StayDatesRangeInput
            defaultValue={dateRangeValue}
            onChange={setDateRangeValue}
          />
        )}
      </div>
    );
  };


  return (
    <div>
      <div className="w-full space-y-5">
        {/*  */}
        {renderInputLocation()}
        {/*  */}
        {renderInputDates()}
      </div>
    </div>
  );
};

export default StaySearchForm;
