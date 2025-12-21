import React, { useState } from "react";
import { useAddCondotel } from "./_context";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";

const demoAmenities = [
  { amenityId: 1, name: "Pool" },
  { amenityId: 2, name: "Wifi" },
  { amenityId: 3, name: "Breakfast" }
];

const PageAddListing5 = () => {
  const { formData, setFormData } = useAddCondotel();
  const [amenityIds, setAmenityIds] = useState<number[]>(formData.amenityIds || []);
  const handleCheck = (id: number) => {
    setAmenityIds((ids: number[]) => ids.includes(id) ? ids.filter((i:number)=>i!==id) : [...ids, id]);
  };
  const handleNext = () => {
    setFormData((prev: Record<string, any>) => ({ ...prev, amenityIds }));
  };
  return (
    <CommonLayout index="05" backtHref="/add-listing-4" nextHref="/add-listing-6" onNext={handleNext}>
      <FormItem label="Chọn tiện ích:">
        {demoAmenities.map((a) => (
          <label key={a.amenityId}>
            <input type="checkbox" checked={amenityIds.includes(a.amenityId)}
              onChange={()=>handleCheck(a.amenityId)} />
            {a.name}
          </label>
        ))}
      </FormItem>
    </CommonLayout>
  );
};
export default PageAddListing5;
