import React, { createContext, useContext, useState } from "react";

type AddCondotelFormData = Record<string, any>;

interface AddCondotelContextType {
  formData: AddCondotelFormData;
  setFormData: React.Dispatch<React.SetStateAction<AddCondotelFormData>>;
  resetForm: () => void;
}

export const AddCondotelContext = createContext<AddCondotelContextType | undefined>(undefined);

export const AddCondotelProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [formData, setFormData] = useState<AddCondotelFormData>({});
  const resetForm = () => setFormData({});
  return (
    <AddCondotelContext.Provider value={{ formData, setFormData, resetForm }}>
      {children}
    </AddCondotelContext.Provider>
  );
};

export const useAddCondotel = () => {
  const context = useContext(AddCondotelContext);
  if (!context) throw new Error("useAddCondotel must be wrapped in AddCondotelProvider");
  return context;
};
