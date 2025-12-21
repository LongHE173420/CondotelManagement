import React, { useState } from "react";
import { useAddCondotel } from "./_context";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";

interface DetailDTO { buildingName?: string, roomNumber?: string }

const PageAddListing8 = () => {
  const { formData, setFormData } = useAddCondotel();
  const [details, setDetails] = useState<DetailDTO[]>(formData.details || []);
  const [buildingName, setBuildingName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const addDetail = () => {
    setDetails((arr:DetailDTO[])=>[...arr,{buildingName,roomNumber}]);
    setBuildingName(""); setRoomNumber("");
  };
  const handleNext = () => {
    setFormData((prev: Record<string, any>) => ({ ...prev, details }));
  };
  return (
    <CommonLayout index="08" backtHref="/add-listing-7" nextHref="/add-listing-9" onNext={handleNext}>
      <FormItem label="Chi tiết phòng">
        <input value={buildingName} onChange={e=>setBuildingName(e.target.value)} placeholder="Building Name" />
        <input value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} placeholder="Room Number" />
        <button onClick={addDetail} type="button">Add</button>
        <ul>
          {details.map((d:DetailDTO, i:number)=>(<li key={i}>{d.buildingName} - {d.roomNumber}</li>))}
        </ul>
      </FormItem>
    </CommonLayout>
  );
};
export default PageAddListing8;
