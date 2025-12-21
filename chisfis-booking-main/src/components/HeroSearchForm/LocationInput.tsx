import React, { useState } from "react";
import { FC } from "react";
import { useEffect } from "react";
import ClearDataButton from "./ClearDataButton";
import { useRef } from "react";
import condotelAPI from "api/condotel";
import locationAPI from "api/location";

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
  const [allLocations, setAllLocations] = useState<string[]>([]);

  useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue);
      // Notify parent component when defaultValue changes
      if (onChange) {
        onChange(defaultValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  useEffect(() => {
    setShowPopover(autoFocus);
  }, [autoFocus]);

  // ✅ Load all locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locations = await locationAPI.getAllPublic();
        // Extract location names
        const locationNames = locations.map(loc => loc.name).filter(Boolean) as string[];
        setAllLocations(locationNames);
      } catch (err) {
        // If API fails, use empty array - no hardcoded fallback
        setAllLocations([]);
      }
    };

    loadLocations();
  }, []);

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
      if (!value || value.length < 1) {
        setLocationSuggestions([]);
        return;
      }

      try {
        setLoadingSuggestions(true);
        // Fetch condotels by location name using public endpoint
        const condotels = await condotelAPI.getCondotelsByLocationPublic(value);
        
        // Extract unique resort names/locations
        const uniqueLocations = new Set<string>();
        if (Array.isArray(condotels)) {
          condotels.forEach((condotel: any) => {
            if (condotel.resortName) {
              uniqueLocations.add(condotel.resortName);
            }
            // Also check location name if available
            if (condotel.locationName) {
              uniqueLocations.add(condotel.locationName);
            }
          });
        }
        
        // Also add the search value itself if it matches
        if (value.trim()) {
          uniqueLocations.add(value.trim());
        }
        
        setLocationSuggestions(Array.from(uniqueLocations).slice(0, 10));
      } catch (err) {
        // Don't set empty array on error - let hardcoded locations show
        setLocationSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Debounce API call - only call if value length >= 2
    if (value.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchLocationSuggestions();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setLocationSuggestions([]);
    }
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
    const selectedLocation = item.trim();
    
    // Update local state
    setValue(selectedLocation);
    
    // Update parent component immediately - call onChange first
    if (onChange) {
      onChange(selectedLocation);
    }
    
    // Then call onInputDone
    if (onInputDone) {
      onInputDone(selectedLocation);
    }
    
    setShowPopover(false);
    
    // Trigger form submit after a short delay to ensure state is updated in parent
    setTimeout(() => {
      // Find the form element and submit it
      const form = containerRef.current?.closest('form');
      if (form) {
        // Use requestSubmit to trigger form validation and submit
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
        // Also try direct submit as fallback
        if (form.requestSubmit) {
          form.requestSubmit();
        } else {
          (form as HTMLFormElement).submit();
        }
      }
    }, 150);
  };

  const renderRecentSearches = () => {
    return (
      <>
        <h3 className="block mt-2 sm:mt-0 px-4 sm:px-8 font-semibold text-base sm:text-lg text-neutral-800 dark:text-neutral-100">
          Địa điểm phổ biến
        </h3>
        <div className="mt-2">
          {allLocations.length > 0 ? (
            allLocations.slice(0, 10).map((item) => (
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
            ))
          ) : (
            <div className="px-4 sm:px-8 py-4 sm:py-5 text-center text-neutral-500">
              Đang tải danh sách địa điểm...
            </div>
          )}
        </div>
      </>
    );
  };

  const renderSearchValue = () => {
    // Filter all locations based on search value
    const filteredLocations = allLocations.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );
    
    // Combine API suggestions with filtered locations (avoid duplicates)
    const allSuggestions = [
      ...locationSuggestions,
      ...filteredLocations.filter((item) => !locationSuggestions.includes(item))
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
          <p>Không tìm thấy địa điểm gợi ý.</p>
          <p className="mt-2 text-sm">Bạn vẫn có thể tìm kiếm với keyword "{value.trim()}"</p>
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

  const handleInputFocus = () => {
    setShowPopover(true);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopover(true);
  };

  return (
    <div className={`relative flex ${className}`} ref={containerRef}>
      <div
        className={`flex flex-1 relative [ nc-hero-field-padding ] flex-shrink-0 items-center space-x-3 text-left  ${
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
            onFocus={handleInputFocus}
            onClick={handleInputClick}
            onChange={(e) => {
              const newValue = e.currentTarget.value;
              setValue(newValue);
              setShowPopover(true); // Show suggestions when typing
              if (onChange) {
                onChange(newValue);
              }
            }}
            onKeyDown={(e) => {
              // Allow Enter key to submit form without closing popover
              if (e.key === "Enter") {
                // Let form handle submit
                return;
              }
              // Close popover on Escape
              if (e.key === "Escape") {
                setShowPopover(false);
              }
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
                if (onChange) {
                  onChange("");
                }
              }}
            />
          )}
        </div>
      </div>
      {showPopover && (
        <div className="absolute left-0 z-40 w-full min-w-[300px] sm:min-w-[500px] bg-white dark:bg-neutral-800 top-full mt-3 py-3 sm:py-6 rounded-3xl shadow-xl max-h-96 overflow-y-auto">
          {value ? (
            <>
              {renderSearchValue()}
              {/* Show option to search with current keyword */}
              {value.trim().length > 0 && (
                <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2">
                  <div
                    onClick={() => {
                      setShowPopover(false);
                    }}
                    className="flex px-4 sm:px-8 items-center space-x-3 sm:space-x-4 py-4 sm:py-5 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer bg-primary-50 dark:bg-primary-900/20"
                  >
                    <span className="block text-primary-600 dark:text-primary-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </span>
                    <span className="block font-medium text-primary-600 dark:text-primary-400">
                      Tìm kiếm với "{value.trim()}"
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            renderRecentSearches()
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
