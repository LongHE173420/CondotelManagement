import React, { FC, useState } from "react";
import Input from "shared/Input/Input";
import Select from "shared/Select/Select";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";
import { AddCondotelProvider, useAddCondotel } from "./_context";

const PageAddListing1Content: FC = () => {
  const { formData, setFormData } = useAddCondotel();
  const [name, setName] = useState(formData.name || "");
  const [propertyType, setPropertyType] = useState(formData.propertyType || "Hotel");
  const [rentalForm, setRentalForm] = useState(formData.rentalForm || "Entire place");

  const handleNext = () => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      name,
      propertyType,
      rentalForm,
      status: "Pending", // Default status
    }));
  };

  return (
    <CommonLayout
      index="01"
      backtHref="/add-listing-1"
      nextHref="/add-listing-2"
      onNext={handleNext}
    >
      <>
        <h2 className="text-2xl font-semibold">Choosing listing categories</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        {/* FORM */}
        <div className="space-y-8">
          {/* ITEM */}
          <FormItem
            label="Choose a property type"
            desc="Hotel: Professional hospitality businesses that usually have a unique style or theme defining their brand and decor"
          >
            <Select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="Hotel">Hotel</option>
              <option value="Cottage">Cottage</option>
              <option value="Villa">Villa</option>
              <option value="Cabin">Cabin</option>
              <option value="Farm stay">Farm stay</option>
              <option value="Houseboat">Houseboat</option>
              <option value="Lighthouse">Lighthouse</option>
            </Select>
          </FormItem>
          <FormItem
            label="Place name *"
            desc="A catchy name usually includes: House name + Room name + Featured property + Tourist destination"
          >
            <Input
              placeholder="Places name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormItem>
          <FormItem
            label="Rental form"
            desc="Entire place: Guests have the whole place to themselves—there's a private entrance and no shared spaces. A bedroom, bathroom, and kitchen are usually included."
          >
            <Select
              value={rentalForm}
              onChange={(e) => setRentalForm(e.target.value)}
            >
              <option value="Entire place">Entire place</option>
              <option value="Private room">Private room</option>
              <option value="Share room">Share room</option>
            </Select>
          </FormItem>
        </div>
      </>
    </CommonLayout>
  );
};

export interface PageAddListing1Props {}

const PageAddListing1: FC<PageAddListing1Props> = () => {
  // Provider đã được wrap ở router level, không cần wrap lại ở đây
  return <PageAddListing1Content />;
};

export default PageAddListing1;
