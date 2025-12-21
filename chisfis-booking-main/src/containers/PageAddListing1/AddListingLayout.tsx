import React from "react";
import { Outlet } from "react-router-dom";
import { AddCondotelProvider } from "./_context";

/**
 * Layout component để wrap tất cả các add-listing routes với AddCondotelProvider
 * Provider này sẽ giữ state formData khi navigate giữa các bước
 */
const AddListingLayout: React.FC = () => {
  return (
    <AddCondotelProvider>
      <Outlet />
    </AddCondotelProvider>
  );
};

export default AddListingLayout;







