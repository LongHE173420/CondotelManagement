import React, { FC } from "react";
import Checkbox from "shared/Checkbox/Checkbox";
import CommonLayout from "./CommonLayout";

export interface PageAddListing4Props {}

const PageAddListing4: FC<PageAddListing4Props> = () => {
  return (
    <CommonLayout
      index="04"
      backtHref="/add-listing-3"
      nextHref="/add-listing-5"
    >
      <>
        <div>
          <h2 className="text-2xl font-semibold">Tiện ích Condotel</h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            Thêm các tiện ích cho condotel của bạn để khách hàng dễ dàng tìm kiếm
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        {/* FORM */}
        <div className="space-y-8">
          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích cơ bản
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Wifi" name="Wifi" defaultChecked />
              <Checkbox label="Điều hòa" name="Air conditioning" defaultChecked />
              <Checkbox label="Smart TV" name="Smart TV" defaultChecked />
              <Checkbox label="Tủ lạnh" name="Fridge" defaultChecked />
              <Checkbox label="Tủ quần áo" name="Wardrobe" defaultChecked />
              <Checkbox label="Bàn làm việc" name="Desk" defaultChecked />
              <Checkbox label="Quạt" name="Fan" />
              <Checkbox label="Máy sưởi" name="Heater" />
              <Checkbox label="Máy lọc không khí" name="Air purifier" />
              <Checkbox label="Nhà vệ sinh riêng" name="Private bathroom" defaultChecked />
              <Checkbox label="Căn hộ riêng tư" name="Private apartment" defaultChecked />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích phòng bếp
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Bếp đầy đủ" name="Full kitchen" defaultChecked />
              <Checkbox label="Bếp gas" name="Gas stove" />
              <Checkbox label="Lò vi sóng" name="Microwave" defaultChecked />
              <Checkbox label="Máy rửa bát" name="Dishwasher" />
              <Checkbox label="Máy pha cà phê" name="Coffee maker" defaultChecked />
              <Checkbox label="Ấm đun nước" name="Kettle" defaultChecked />
              <Checkbox label="Nồi chiên không dầu" name="Air fryer" />
              <Checkbox label="Máy xay sinh tố" name="Blender" />
              <Checkbox label="Bàn ăn" name="Dining table" defaultChecked />
              <Checkbox label="Đồ dùng nhà bếp" name="Kitchen utensils" defaultChecked />
              <Checkbox label="Tủ lạnh siêu âm" name="Mini fridge" />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích giặt ủi
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Máy giặt" name="Washing machine" />
              <Checkbox label="Máy sấy" name="Dryer" />
              <Checkbox label="Bàn là" name="Iron" defaultChecked />
              <Checkbox label="Giá phơi quần áo" name="Clothes rack" />
              <Checkbox label="Sản phẩm giặt ủi" name="Laundry products" />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích phòng tắm
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Đồ vệ sinh miễn phí" name="Free toiletries" defaultChecked />
              <Checkbox label="Khăn tắm" name="Towel" defaultChecked />
              <Checkbox label="Máy sấy tóc" name="Hair dryer" defaultChecked />
              <Checkbox label="Vòi sen" name="Shower" defaultChecked />
              <Checkbox label="Bồn tắm" name="Bathtub" />
              <Checkbox label="Máy nước nóng" name="Hot water" defaultChecked />
              <Checkbox label="Gương trang điểm" name="Makeup mirror" />
              <Checkbox label="Kỳ cọ tắm" name="Bath towel" defaultChecked />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích khu nghỉ dưỡng
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Hồ bơi" name="Swimming pool" defaultChecked />
              <Checkbox label="Gym/Fitness center" name="Gym" defaultChecked />
              <Checkbox label="Spa & Wellness" name="Spa" />
              <Checkbox label="Sauna" name="Sauna" />
              <Checkbox label="Tennis Court" name="Tennis court" />
              <Checkbox label="Children's playground" name="Playground" />
              <Checkbox label="Golf course" name="Golf" />
              <Checkbox label="Beach access" name="Beach" />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Dịch vụ khách sạn
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Lễ tân 24/7" name="24/7 reception" defaultChecked />
              <Checkbox label="Dịch vụ phòng" name="Room service" />
              <Checkbox label="Dọn dẹp hàng ngày" name="Daily housekeeping" />
              <Checkbox label="Concierge" name="Concierge" />
              <Checkbox label="Đưa đón sân bay" name="Airport shuttle" />
              <Checkbox label="Bell service" name="Bell service" />
              <Checkbox label="Nhiếp ảnh gia" name="Photographer" />
              <Checkbox label="Dịch vụ massage" name="Massage service" />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích an toàn
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Báo cháy" name="Fire alarm" defaultChecked />
              <Checkbox label="Bình chữa cháy" name="Fire extinguisher" defaultChecked />
              <Checkbox label="Két sắt" name="Safe box" defaultChecked />
              <Checkbox label="Khóa thông minh" name="Smart lock" defaultChecked />
              <Checkbox label="CCTV" name="CCTV" />
              <Checkbox label="Bảo vệ 24/7" name="Security 24/7" defaultChecked />
              <Checkbox label="Hệ thống chống trộm" name="Anti-theft" />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích ngoài trời & Giao thông
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Bãi đậu xe" name="Parking" defaultChecked />
              <Checkbox label="Bãi đậu xe có mái che" name="Covered parking" />
              <Checkbox label="Ban công" name="Balcony" />
              <Checkbox label="Sân thượng" name="Terrace" />
              <Checkbox label="Vườn BBQ" name="BBQ area" />
              <Checkbox label="Lối ra biển riêng" name="Private beach access" />
              <Checkbox label="Thuê xe đạp" name="Bike rental" />
              <Checkbox label="Thuê xe máy" name="Motorcycle rental" />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích ẩm thực
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Nhà hàng" name="Restaurant" />
              <Checkbox label="Quán bar" name="Bar" />
              <Checkbox label="Quán cà phê" name="Coffee shop" />
              <Checkbox label="Phòng ăn buffet" name="Buffet dining" />
              <Checkbox label="Dịch vụ đồ ăn" name="Food delivery" />
              <Checkbox label="Minibar" name="Minibar" defaultChecked />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích giải trí
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Phòng karaoke" name="Karaoke room" />
              <Checkbox label="Phòng chơi game" name="Game room" />
              <Checkbox label="Sân khấu biểu diễn" name="Live music" />
              <Checkbox label="Rạp chiếu phim" name="Cinema" />
              <Checkbox label="Sân bóng rổ" name="Basketball court" />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích cho gia đình & Trẻ em
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Giường phụ" name="Extra bed" />
              <Checkbox label="Nôi trẻ em" name="Baby cot" />
              <Checkbox label="High chair" name="High chair" />
              <Checkbox label="Đồ chơi trẻ em" name="Children toys" />
              <Checkbox label="Phòng trẻ em" name="Kids room" />
              <Checkbox label="Dịch vụ trông trẻ" name="Babysitting" />
            </div>
          </div>

          {/* ITEM */}
          <div>
            <label className="text-lg font-semibold" htmlFor="">
              Tiện ích công nghệ
            </label>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Checkbox label="Điều khiển bằng giọng nói" name="Voice control" />
              <Checkbox label="Đèn thông minh" name="Smart lighting" />
              <Checkbox label="Cửa cuốn tự động" name="Smart blinds" />
              <Checkbox label="Streaming services" name="Streaming" defaultChecked />
              <Checkbox label="Wireless charging" name="Wireless charging" />
              <Checkbox label="USB outlets" name="USB outlets" defaultChecked />
            </div>
          </div>
        </div>
      </>
    </CommonLayout>
  );
};

export default PageAddListing4;
