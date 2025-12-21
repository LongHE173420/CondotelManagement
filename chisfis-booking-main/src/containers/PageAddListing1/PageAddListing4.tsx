import React, { useState, useEffect } from "react";
import { useAddCondotel } from "./_context";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";

const PageAddListing4 = () => {
  const { formData, setFormData } = useAddCondotel();
  const [pricePerNight, setPricePerNight] = useState<number>(Number((formData && formData["pricePerNight"]) || 0));

  useEffect(() => {
    setFormData((prev: Record<string, any>) => ({ ...prev, pricePerNight }));
  }, [pricePerNight, setFormData]);

  return (
    <CommonLayout
      index="04"
      backtHref="/add-listing-3"
      nextHref="/add-listing-5"
    >
      <FormItem label="Giá mỗi đêm">
        <input
          type="number"
          className="input"
          value={pricePerNight}
          onChange={e=>setPricePerNight(Number(e.target.value))}
        />
      </FormItem>
    </CommonLayout>
  );
};
export default PageAddListing4;
