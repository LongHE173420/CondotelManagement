import React, { useState } from "react";
import { useAddCondotel } from "./_context";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";

const demoUtilities = [
  { utilityId: 10, name: "Parking" },
  { utilityId: 11, name: "Gym" }
];

const PageAddListing6 = () => {
  const { formData, setFormData } = useAddCondotel();
  const [utilityIds, setUtilityIds] = useState<number[]>(formData.utilityIds || []);
  const handleCheck = (id: number) => {
    setUtilityIds((ids: number[]) => ids.includes(id) ? ids.filter((i:number)=>i!==id) : [...ids, id]);
  };
  const handleNext = () => {
    setFormData((prev: Record<string, any>) => ({ ...prev, utilityIds }));
  };
  return (
    <CommonLayout index="06" backtHref="/add-listing-5" nextHref="/add-listing-7" onNext={handleNext}>
      <FormItem label="Chọn tiện nghi:">
        {demoUtilities.map((u) => (
          <label key={u.utilityId}>
            <input type="checkbox" checked={utilityIds.includes(u.utilityId)}
              onChange={()=>handleCheck(u.utilityId)} />
            {u.name}
          </label>
        ))}
      </FormItem>
    </CommonLayout>
  );
};
export default PageAddListing6;
