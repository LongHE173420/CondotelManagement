import React, { useEffect, useState } from "react";
import LocationInput from "./LocationInput";
import { FocusedInputShape } from "react-dates";
import StayDatesRangeInput from "./StayDatesRangeInput";
import moment from "moment";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

export interface DateRage {
  startDate: moment.Moment | null;
  endDate: moment.Moment | null;
}

export type StaySearchFormFields = "location" | "dates";

export interface StaySearchFormProps {
  haveDefaultValue?: boolean;
  defaultFieldFocus?: StaySearchFormFields;
}

// DEFAULT DATA FOR ARCHIVE PAGE
const defaultLocationValue = "Tokyo, Jappan";
const defaultDateRange = {
  startDate: moment(),
  endDate: moment().add(4, "days"),
};


const StaySearchForm: FC<StaySearchFormProps> = ({
  haveDefaultValue = false,
  defaultFieldFocus,
}) => {
  const navigate = useNavigate();
  
  const [dateRangeValue, setDateRangeValue] = useState<DateRage>({
    startDate: null,
    endDate: null,
  });
  const [locationInputValue, setLocationInputValue] = useState("");

  const [dateFocused, setDateFocused] = useState<FocusedInputShape | null>(
    null
  );

  //

  useEffect(() => {
    if (defaultFieldFocus === "dates") {
      setDateFocused("startDate");
    } else {
      setDateFocused(null);
    }
  }, [defaultFieldFocus]);

  useEffect(() => {
    if (haveDefaultValue) {
      setDateRangeValue(defaultDateRange);
      setLocationInputValue(defaultLocationValue);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build search params
    const params = new URLSearchParams();
    
    // Set location
    if (locationInputValue && locationInputValue.trim()) {
      const trimmedLocation = locationInputValue.trim();
      if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmedLocation)) {
        params.set("location", trimmedLocation);
      }
    }
    
    // Set dates
    if (dateRangeValue.startDate) {
      params.set("startDate", dateRangeValue.startDate.format("YYYY-MM-DD"));
    }
    
    if (dateRangeValue.endDate) {
      params.set("endDate", dateRangeValue.endDate.format("YYYY-MM-DD"));
    }
    
    
    const queryString = params.toString();
    const url = `/listing-stay${queryString ? `?${queryString}` : ""}`;
    navigate(url, { 
      state: { 
        searchParams: Object.fromEntries(params),
        preserveQuery: true 
      }
    });
  };
  //

  const renderForm = () => {
    return (
      <form className="relative flex rounded-full border border-neutral-200 dark:border-neutral-700" onSubmit={handleSubmit}>
        <LocationInput
          defaultValue={locationInputValue}
          onChange={(e) => setLocationInputValue(e)}
          onInputDone={() => setDateFocused("startDate")}
          className="flex-[1.5]"
          autoFocus={defaultFieldFocus === "location"}
        />
        <StayDatesRangeInput
          defaultValue={dateRangeValue}
          defaultFocus={dateFocused}
          onChange={(data) => {
            setDateRangeValue(data);
          }}
          className="flex-[2]"
        />
      </form>
    );
  };

  return renderForm();
};

export default StaySearchForm;
