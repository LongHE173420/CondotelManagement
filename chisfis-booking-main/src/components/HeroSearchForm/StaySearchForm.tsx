import React, { useEffect, useState } from "react";
import LocationInput from "./LocationInput";
import GuestsInput, { GuestsInputProps } from "./GuestsInput";
import { FocusedInputShape } from "react-dates";
import StayDatesRangeInput from "./StayDatesRangeInput";
import moment from "moment";
import { FC } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface DateRage {
  startDate: moment.Moment | null;
  endDate: moment.Moment | null;
}

export interface StaySearchFormProps {
  haveDefaultValue?: boolean;
}

// DEFAULT DATA FOR ARCHIVE PAGE
const defaultLocationValue = "Tokyo, Jappan";
const defaultDateRange = {
  startDate: moment(),
  endDate: moment().add(4, "days"),
};
const defaultGuestValue: GuestsInputProps["defaultValue"] = {
  guestAdults: 2,
  guestChildren: 2,
  guestInfants: 1,
};

const StaySearchForm: FC<StaySearchFormProps> = ({
  haveDefaultValue = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize location from URL if available
  const searchParams = new URLSearchParams(location.search);
  const locationFromUrl = searchParams.get("location");
  // Always prioritize URL location, never use default "Tokyo" if URL has location
  const initialLocation = locationFromUrl || "";
  
  const [dateRangeValue, setDateRangeValue] = useState<DateRage>({
    startDate: null,
    endDate: null,
  });
  const [locationInputValue, setLocationInputValue] = useState(initialLocation);
  const [guestValue, setGuestValue] = useState<GuestsInputProps["defaultValue"]>({});

  const [dateFocused, setDateFocused] = useState<FocusedInputShape | null>(
    null
  );

  //
  useEffect(() => {
    // Check if location is in URL search params
    const searchParams = new URLSearchParams(location.search);
    const locationFromUrl = searchParams.get("location");
    const startDateFromUrl = searchParams.get("startDate");
    const endDateFromUrl = searchParams.get("endDate");
    const guestsFromUrl = searchParams.get("guests");
    
    if (locationFromUrl) {
      // Always use location from URL if available
      setLocationInputValue(locationFromUrl);
    } else {
      // Clear location if no URL location (never use default "Tokyo")
      setLocationInputValue("");
      // Only set default dates and guests if haveDefaultValue is true
      if (haveDefaultValue) {
        setDateRangeValue(defaultDateRange);
        setGuestValue(defaultGuestValue);
      }
    }
    
    // Update dates from URL if available
    if (startDateFromUrl && endDateFromUrl) {
      setDateRangeValue({
        startDate: moment(startDateFromUrl),
        endDate: moment(endDateFromUrl),
      });
    }
    
    // Update guests from URL if available
    if (guestsFromUrl) {
      const totalGuests = parseInt(guestsFromUrl, 10);
      setGuestValue({
        guestAdults: totalGuests,
        guestChildren: 0,
        guestInfants: 0,
      });
    }
  }, [location.search, haveDefaultValue]);
  //

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get the latest location value - prioritize state over input value
      const form = e.currentTarget as HTMLFormElement;
      const locationInput = form.querySelector('input[type="text"]') as HTMLInputElement;
      // Use locationInputValue state (which is updated by LocationInput onChange) as primary source
      // Fallback to input value if state is not available
      const currentLocationValue = (locationInputValue?.trim() || locationInput?.value?.trim() || "").trim();
      
      console.log("🔍 StaySearchForm - Submitting with location:", currentLocationValue);
      console.log("🔍 StaySearchForm - locationInputValue state:", locationInputValue);
      console.log("🔍 StaySearchForm - input value:", locationInput?.value);
      
      // Build search params - IMPORTANT: Set location FIRST, then dates
      const params = new URLSearchParams();
      
      // Set location FIRST to ensure it's not overwritten
      if (currentLocationValue && currentLocationValue.length > 0) {
        // Validate location is not a date format
        const isDate = /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(currentLocationValue) || /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(currentLocationValue);
        if (!isDate) {
          params.set("location", currentLocationValue);
          console.log("✅ StaySearchForm - Setting location param:", currentLocationValue);
        } else {
          console.log("⚠️ StaySearchForm - Location looks like date, skipping:", currentLocationValue);
        }
      }
      
      // Then set dates
      if (dateRangeValue.startDate) {
        params.set("startDate", dateRangeValue.startDate.format("YYYY-MM-DD"));
        console.log("✅ StaySearchForm - Setting startDate:", dateRangeValue.startDate.format("YYYY-MM-DD"));
      }
      
      if (dateRangeValue.endDate) {
        params.set("endDate", dateRangeValue.endDate.format("YYYY-MM-DD"));
        console.log("✅ StaySearchForm - Setting endDate:", dateRangeValue.endDate.format("YYYY-MM-DD"));
      }
      
      // Calculate total guests
      const totalGuests = 
        (guestValue.guestAdults || 0) + 
        (guestValue.guestChildren || 0) + 
        (guestValue.guestInfants || 0);
      
      if (totalGuests > 0) {
        params.set("guests", totalGuests.toString());
        console.log("✅ StaySearchForm - Setting guests:", totalGuests);
      }

      // No need for _search flag - components will auto-search when params exist

      const finalQueryString = params.toString();
      console.log("🔍 StaySearchForm - Final query string:", finalQueryString);
      console.log("🔍 StaySearchForm - All params:", Object.fromEntries(params));
      
      // Navigate to listing-stay-map if location is provided, otherwise listing-stay
      const hasLocation = params.get("location");
      const targetPath = hasLocation ? "/listing-stay-map" : "/listing-stay";
      const finalUrl = `${targetPath}${finalQueryString ? `?${finalQueryString}` : ""}`;
      console.log("🔍 StaySearchForm - Navigating to:", finalUrl);
      console.log("🔍 StaySearchForm - Has location:", hasLocation);
      navigate(finalUrl, { 
        state: { 
          searchParams: Object.fromEntries(params),
          preserveQuery: true 
        }
      });
    } catch (error) {
      // Fallback: navigate to listing page without params
      navigate("/listing-stay");
    }
  };

  const renderForm = () => {
    return (
      <form 
        onSubmit={handleSubmit}
        className="w-full relative mt-8 flex rounded-full shadow-xl dark:shadow-2xl bg-white dark:bg-neutral-800 "
      >
        <LocationInput
          defaultValue={locationInputValue}
          onChange={(value) => {
            setLocationInputValue(value);
          }}
          onInputDone={(value) => {
            // Ensure location is set before focusing date
            setLocationInputValue(value);
            setDateFocused("startDate");
          }}
          className="flex-[1.5]"
        />
        <StayDatesRangeInput
          defaultValue={dateRangeValue}
          defaultFocus={dateFocused}
          onChange={(data) => setDateRangeValue(data)}
          className="flex-[2]"
        />
        <GuestsInput
          defaultValue={guestValue}
          onChange={(data) => setGuestValue(data)}
          className="flex-[1.2]"
        />
        <button
          type="submit"
          className="px-8 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors font-medium"
        >
          Search
        </button>
      </form>
    );
  };

  return renderForm();
};

export default StaySearchForm;
