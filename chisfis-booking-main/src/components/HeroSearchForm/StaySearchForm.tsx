import React, { useEffect, useState } from "react";
import LocationInput from "./LocationInput";
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
    if (locationFromUrl) {
      // Always use location from URL if available
      setLocationInputValue(locationFromUrl);
    } else {
      // Clear location if no URL location (never use default "Tokyo")
      setLocationInputValue("");
      // Only set default dates if haveDefaultValue is true
      if (haveDefaultValue) {
        setDateRangeValue(defaultDateRange);
      }
    }
    
    // Update dates from URL if available
    if (startDateFromUrl && endDateFromUrl) {
      setDateRangeValue({
        startDate: moment(startDateFromUrl),
        endDate: moment(endDateFromUrl),
      });
    }
  }, [location.search, haveDefaultValue]);
  //

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use controlled state for location (avoid grabbing other text inputs from the form)
      const currentLocationValue = (locationInputValue || "").trim();
      
      // Start from current URL params to preserve any existing filters, then override with form values
      const params = new URLSearchParams(location.search || "");
      
      // Set location (and alias searchLocation for compatibility)
      if (currentLocationValue && currentLocationValue.trim()) {
        const trimmedLocation = currentLocationValue.trim();
        // Validate location is not a date format
        if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmedLocation)) {
          params.set("location", trimmedLocation);
          params.set("searchLocation", trimmedLocation);
        }
      } else {
        params.delete("location");
        params.delete("searchLocation");
      }
      
      // Then set dates
      if (dateRangeValue.startDate) {
        params.set("startDate", dateRangeValue.startDate.format("YYYY-MM-DD"));
      } else {
        params.delete("startDate");
      }
      
      if (dateRangeValue.endDate) {
        params.set("endDate", dateRangeValue.endDate.format("YYYY-MM-DD"));
      } else {
        params.delete("endDate");
      }
      

      // Navigate to listing-stay page with search params
      const finalQueryString = params.toString();
      const finalParamsObj = Object.fromEntries(params);

      // Validate: location should not be a date format
      const locationParam = params.get("location");
      if (locationParam && /^\d{2}\/\d{2}\/\d{4}$/.test(locationParam)) {
        params.delete("location");
        params.delete("searchLocation");
        if (currentLocationValue && !/^\d{2}\/\d{2}\/\d{4}$/.test(currentLocationValue)) {
          params.set("location", currentLocationValue);
          params.set("searchLocation", currentLocationValue);
        }
      }
      
      const finalQuery = params.toString();
      if (currentLocationValue && currentLocationValue.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(currentLocationValue.trim())) {
        // If location is provided and valid, navigate to map view
        const finalUrl = `/listing-stay-map${finalQuery ? `?${finalQuery}` : ""}`;
        navigate(finalUrl, { 
          state: { 
            searchParams: finalParamsObj,
            preserveQuery: true 
          }
        });
      } else {
        // Otherwise, navigate to list view
        const finalUrl = `/listing-stay${finalQuery ? `?${finalQuery}` : ""}`;
        navigate(finalUrl, { 
          state: { 
            searchParams: finalParamsObj,
            preserveQuery: true 
          }
        });
      }
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
