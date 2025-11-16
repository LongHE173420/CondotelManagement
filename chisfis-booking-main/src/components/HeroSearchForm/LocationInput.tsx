import React, { useState } from "react";
import { FC } from "react";
import { useEffect } from "react";
import ClearDataButton from "./ClearDataButton";
import { useRef } from "react";
import condotelAPI from "api/condotel";

export interface LocationInputProps {
  defaultValue: string;
  onChange?: (value: string) => void;
  onInputDone?: (value: string) => void;
  placeHolder?: string;
  desc?: string;
  className?: string;
  autoFocus?: boolean;
}

const LocationInput: FC<LocationInputProps> = ({
  defaultValue,
  autoFocus = false,
  onChange,
  onInputDone,
  placeHolder = "Location",
  desc = "Where are you going?",
  className = "nc-flex-1.5",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState(defaultValue);
  const [showPopover, setShowPopover] = useState(autoFocus);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue);
      // Notify parent component when defaultValue changes
      if (onChange && defaultValue) {
        onChange(defaultValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  useEffect(() => {
    setShowPopover(autoFocus);
  }, [autoFocus]);

  useEffect(() => {
    if (eventClickOutsideDiv) {
      document.removeEventListener("click", eventClickOutsideDiv);
    }
    showPopover && document.addEventListener("click", eventClickOutsideDiv);
    return () => {
      document.removeEventListener("click", eventClickOutsideDiv);
    };
  }, [showPopover]);

  useEffect(() => {
    if (showPopover && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPopover]);

  // Fetch location suggestions from API when user types
  useEffect(() => {
    const fetchLocationSuggestions = async () => {
      if (!value || value.length < 2) {
        setLocationSuggestions([]);
        return;
      }

      try {
        setLoadingSuggestions(true);
        // Fetch condotels by location name using public endpoint
        const condotels = await condotelAPI.getCondotelsByLocationPublic(value);
        
        // Extract unique resort names/locations
        const uniqueLocations = new Set<string>();
        condotels.forEach((condotel: any) => {
          if (condotel.resortName) {
            uniqueLocations.add(condotel.resortName);
          }
        });
        
        // Also add the search value itself if it matches
        if (value.trim()) {
          uniqueLocations.add(value.trim());
        }
        
        setLocationSuggestions(Array.from(uniqueLocations).slice(0, 10));
      } catch (err) {
        console.error("Error fetching location suggestions:", err);
        setLocationSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Debounce API call
    const timeoutId = setTimeout(() => {
      fetchLocationSuggestions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const eventClickOutsideDiv = (event: MouseEvent) => {
    if (!containerRef.current) return;
    // CLICK IN_SIDE
    if (!showPopover || containerRef.current.contains(event.target as Node)) {
      return;
    }
    // CLICK OUT_SIDE
    setShowPopover(false);
  };

  const handleSelectLocation = (item: string) => {
    setValue(item);
    onInputDone && onInputDone(item);
    setShowPopover(false);
  };

  const renderRecentSearches = () => {
    const VN_LOCATIONS = [
      "Hà Nội",
      "TP. Hồ Chí Minh",
      "Đà Nẵng",
      "Nha Trang",
      "Huế",
      "Hạ Long",
      "Hội An",
      "Phú Quốc",
      "Đà Lạt",
      "Sapa",
      "Mũi Né",
      "Vũng Tàu",
      "Cần Thơ",
      "Vinh",
    ];
    return (
      <>
        <h3 className="block mt-2 sm:mt-0 px-4 sm:px-8 font-semibold text-base sm:text-lg text-neutral-800 dark:text-neutral-100">
          Địa điểm phổ biến tại Việt Nam
        </h3>
        <div className="mt-2">
          {VN_LOCATIONS.map((item) => (
            <span
              onClick={() => handleSelectLocation(item)}
              key={item}
              className="flex px-4 sm:px-8 items-center space-x-3 sm:space-x-4 py-4 sm:py-5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
            >
              <span className="block text-neutral-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 sm:h-6 w-4 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
              <span className=" block font-medium text-neutral-700 dark:text-neutral-200">
                {item}
              </span>
            </span>
          ))}
        </div>
      </>
    );
  };

  const renderSearchValue = () => {
    const VN_LOCATIONS = [
      "Hà Nội",
      "TP. Hồ Chí Minh",
      "Đà Nẵng",
      "Nha Trang",
      "Huế",
      "Hạ Long",
      "Hội An",
      "Phú Quốc",
      "Đà Lạt",
      "Sapa",
      "Mũi Né",
      "Vũng Tàu",
      "Cần Thơ",
      "Vinh",
    ];
    
    // Filter hardcoded locations
    const filteredHardcoded = VN_LOCATIONS.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );
    
    // Combine API suggestions with hardcoded locations
    const allSuggestions = [
      ...locationSuggestions,
      ...filteredHardcoded.filter((item) => !locationSuggestions.includes(item))
    ].slice(0, 10);

    if (loadingSuggestions && value.length >= 2) {
      return (
        <div className="px-4 sm:px-8 py-4 sm:py-5 text-center text-neutral-500">
          Đang tìm kiếm...
        </div>
      );
    }

    if (allSuggestions.length === 0 && value.length >= 2) {
      return (
        <div className="px-4 sm:px-8 py-4 sm:py-5 text-center text-neutral-500">
          Không tìm thấy địa điểm. Bạn có thể tìm kiếm với tên địa điểm khác.
        </div>
      );
    }

    return (
      <>
        {allSuggestions.map((item) => (
          <span
            onClick={() => handleSelectLocation(item)}
            key={item}
            className="flex px-4 sm:px-8 items-center space-x-3 sm:space-x-4 py-4 sm:py-5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
          >
            <span className="block text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
            <span className="block font-medium text-neutral-700 dark:text-neutral-200">
              {item}
            </span>
          </span>
        ))}
      </>
    );
  };

  return (
    <div className={`relative flex ${className}`} ref={containerRef}>
      <div
        onClick={() => setShowPopover(true)}
        className={`flex flex-1 relative [ nc-hero-field-padding ] flex-shrink-0 items-center space-x-3 cursor-pointer focus:outline-none text-left  ${
          showPopover ? "nc-hero-field-focused" : ""
        }`}
      >
        <div className="text-neutral-300 dark:text-neutral-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="nc-icon-field"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div className="flex-grow">
          <input
            className={`block w-full bg-transparent border-none focus:ring-0 p-0 focus:outline-none focus:placeholder-neutral-300 xl:text-lg font-semibold placeholder-neutral-800 dark:placeholder-neutral-200 truncate`}
            placeholder={placeHolder}
            value={value}
            autoFocus={showPopover}
            onChange={(e) => {
              setValue(e.currentTarget.value);
              onChange && onChange(e.currentTarget.value);
            }}
            ref={inputRef}
          />
          <span className="block mt-0.5 text-sm text-neutral-400 font-light ">
            <span className="line-clamp-1">{!!value ? placeHolder : desc}</span>
          </span>
          {value && showPopover && (
            <ClearDataButton
              onClick={() => {
                setValue("");
                onChange && onChange("");
              }}
            />
          )}
        </div>
      </div>
      {showPopover && (
        <div className="absolute left-0 z-40 w-full min-w-[300px] sm:min-w-[500px] bg-white dark:bg-neutral-800 top-full mt-3 py-3 sm:py-6 rounded-3xl shadow-xl max-h-96 overflow-y-auto">
          {value ? renderSearchValue() : renderRecentSearches()}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
