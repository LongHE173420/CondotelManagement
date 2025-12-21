import { MapPinIcon } from "@heroicons/react/24/solid";
import LocationMarker from "components/AnyReactComponent/LocationMarker";
import Label from "components/Label/Label";
import GoogleMapReact from "google-map-react";
import React, { FC, useEffect } from "react";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import Input from "shared/Input/Input";
import Select from "shared/Select/Select";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";
import locationAPI, { LocationDTO } from "api/location";
import resortAPI from "api/resort";
import { useAddCondotel } from "./_context";

export interface PageAddListing2Props {}

const PageAddListing2: FC<PageAddListing2Props> = () => {
  const { formData, setFormData } = useAddCondotel();
  const [location, setLocation] = React.useState<LocationDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Tự động lấy location từ resort khi component mount
  useEffect(() => {
    const loadLocationFromResort = async () => {
      try {
        // Nếu đã có locationId trong formData (từ resort)
        if (formData.locationId) {
          const locations = await locationAPI.getAll();
          const foundLocation = locations.find(l => l.locationId === formData.locationId);
          if (foundLocation) {
            setLocation(foundLocation);
            setFormData(prev => ({
              ...prev,
              locationId: foundLocation.locationId,
              location: foundLocation,
              locationName: foundLocation.name || "",
            }));
            return;
          }
        }
        
        // Nếu có resortId, lấy locationId từ resort
        if (formData.resortId) {
          const resort = await resortAPI.getById(formData.resortId);
          if (resort.locationId) {
            const locations = await locationAPI.getAll();
            const foundLocation = locations.find(l => l.locationId === resort.locationId);
            if (foundLocation) {
              setLocation(foundLocation);
              setFormData(prev => ({
                ...prev,
                locationId: foundLocation.locationId,
                location: foundLocation,
                locationName: foundLocation.name || "",
              }));
              return;
            }
          }
        }
        
        // Nếu đã có location object trong formData
        if (formData.location) {
          setLocation(formData.location);
        }
      } catch (err: any) {
      }
    };
    loadLocationFromResort();
  }, [formData.locationId, formData.resortId, formData.location]);

  const handleNext = async () => {
    setError("");
    
    // Validate: Phải có location (từ resort)
    if (!location && !formData.locationId) {
      setError("Không tìm thấy địa điểm từ resort. Vui lòng quay lại bước trước và chọn resort!");
      return;
    }

    // Location đã được lưu trong useEffect, chỉ cần tiếp tục
    // Navigation sẽ được xử lý bởi CommonLayout với nextHref
  };

  // Chuyển các field dưới thành controlled inputs sử dụng localLocation & onChange
  // Và truyền handleNext vào CommonLayout
  return (
    <CommonLayout
      index="02"
      nextHref="/add-listing-3"
      backtHref="/add-listing-1"
      onNext={handleNext}
    >
      <>
        <h2 className="text-2xl font-semibold">Your place location</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        {/* FORM */}
        <div className="space-y-8">
          {error && (
            <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Hiển thị thông tin địa điểm từ resort */}
          {location ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center mb-2">
                <MapPinIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">Địa điểm từ Resort</h3>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                Địa điểm đã được tự động lấy từ resort đã chọn.
              </p>
              <div className="space-y-1 text-sm">
                <p><strong>Tên:</strong> {location.name}</p>
                {location.description && <p><strong>Mô tả:</strong> {location.description}</p>}
                {location.imageUrl && (
                  <div className="mt-2">
                    <img src={location.imageUrl} alt={location.name} className="w-full h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          ) : formData.locationId ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Đang tải thông tin địa điểm từ resort...
              </p>
            </div>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ Không tìm thấy địa điểm từ resort. Vui lòng quay lại bước trước và chọn resort có địa điểm.
              </p>
            </div>
          )}
          <div>
            <Label>Detailed address</Label>
            <span className="block mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              1110 Pennsylvania Avenue NW, Washington, DC 20230
            </span>
            <div className="mt-4">
              <div className="aspect-w-5 aspect-h-5 sm:aspect-h-3">
                <div className="rounded-xl overflow-hidden">
                  <GoogleMapReact
                    bootstrapURLKeys={{
                      key: "AIzaSyAGVJfZMAKYfZ71nzL_v5i3LjTTWnCYwTY",
                    }}
                    yesIWantToUseGoogleMapApiInternals
                    defaultZoom={15}
                    defaultCenter={{
                      lat: 55.9607277,
                      lng: 36.2172614,
                    }}
                  >
                    <LocationMarker lat={55.9607277} lng={36.2172614} />
                  </GoogleMapReact>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </CommonLayout>
  );
};

export default PageAddListing2;
