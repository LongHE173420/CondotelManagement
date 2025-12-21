import React, { useState } from "react";
import { useAddCondotel } from "./_context";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";
import NcInputNumber from "components/NcInputNumber/NcInputNumber";
import Select from "shared/Select/Select";

const PageAddListing3 = () => {
  const { formData, setFormData } = useAddCondotel();
  const [beds,setBeds] = useState<number>(formData?.beds || 1);
  const [bathrooms,setBathrooms] = useState<number>(formData?.bathrooms || 1);

  const handleNext = () => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      beds,
      bathrooms,
    }));
  };

  return (
    <CommonLayout
      index="03"
      backtHref="/add-listing-2"
      nextHref="/add-listing-4"
      onNext={handleNext}
    >
      <div className="space-y-8">
        <FormItem label="Beds">
          <NcInputNumber defaultValue={beds} onChange={(v:number)=>setBeds(v)} />
        </FormItem>
        <FormItem label="Bathrooms">
          <NcInputNumber defaultValue={bathrooms} onChange={(v:number)=>setBathrooms(v)} />
        </FormItem>
      </div>
    </CommonLayout>
  );
};
export default PageAddListing3;
