import React, { useState } from "react";
import { useAddCondotel } from "./_context";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";

const PageAddListing9 = () => {
  const { formData, setFormData } = useAddCondotel();
  const [status, setStatus] = useState<string>(formData.status || "Active");
  const [description, setDescription] = useState<string>(formData.description || "");
  const handleNext = () => {
    setFormData((prev: Record<string, any>) => ({ ...prev, status, description }));
  };
  return (
    <CommonLayout index="09" backtHref="/add-listing-8" nextHref="/add-listing-10" onNext={handleNext}>
      <FormItem label="Trạng thái căn hộ">
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="Active">Active (Hoạt động)</option>
          <option value="Inactive">Inactive (Không hoạt động)</option>
        </select>
      </FormItem>
      <FormItem label="Mô tả">
        <textarea value={description} onChange={e=>setDescription(e.target.value)} />
      </FormItem>
    </CommonLayout>
  );
};
export default PageAddListing9;
