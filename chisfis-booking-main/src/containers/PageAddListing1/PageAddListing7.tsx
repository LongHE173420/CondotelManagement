import React, { useState } from "react";
import { useAddCondotel } from "./_context";
import CommonLayout from "./CommonLayout";
import FormItem from "./FormItem";

interface ImageDTO { imageUrl: string; caption?: string; }

const PageAddListing7 = () => {
  const { formData, setFormData } = useAddCondotel();
  const [imgUrl, setImgUrl] = useState<string>("");
  const [images, setImages] = useState<ImageDTO[]>(formData.images || []);
  const addImg = () => {
    if(imgUrl) setImages((arr:ImageDTO[])=>[...arr,{imageUrl:imgUrl}]);
    setImgUrl("");
  };
  const handleNext = () => {
    setFormData((prev: Record<string, any>) => ({ ...prev, images }));
  };
  return (
    <CommonLayout index="07" backtHref="/add-listing-6" nextHref="/add-listing-8" onNext={handleNext}>
      <FormItem label="Thêm ảnh">
        <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="Image url" />
        <button onClick={addImg} type="button">Add</button>
        <div>
          {images.map((img:ImageDTO,i:number)=>(<img key={i} src={img.imageUrl} alt="" style={{width:100}} />))}
        </div>
      </FormItem>
    </CommonLayout>
  );
};
export default PageAddListing7;
