import React, { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import condotelAPI, { CondotelDetailDTO } from "api/condotel";
import { useAuth } from "contexts/AuthContext";
import NcImage from "shared/NcImage/NcImage";
import LikeSaveBtns from "./LikeSaveBtns";
import ModalPhotos from "./ModalPhotos";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import SectionSliderNewCategories from "components/SectionSliderNewCategories/SectionSliderNewCategories";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import StartRating from "components/StartRating/StartRating";
import FiveStartIconForRate from "components/FiveStartIconForRate/FiveStartIconForRate";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import Input from "shared/Input/Input";
import ButtonCircle from "shared/Button/ButtonCircle";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Avatar from "shared/Avatar/Avatar";
import MobileFooterSticky from "./MobileFooterSticky";


const ListingStayDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<CondotelDetailDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [openFocusIndex, setOpenFocusIndex] = useState(0);
  const [hostName, setHostName] = useState<string>("");
  const [hostImageUrl, setHostImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("Không tìm thấy ID căn hộ");
          return;
        }
        const res = await condotelAPI.getById(Number(id));
        setData(res);
        console.log("📦 CondotelDetailDTO response:", res);
        console.log("👤 Current user:", user);
        
        // Ưu tiên: Backend trả về hostName và hostImageUrl
        if (res.hostName) {
          console.log("✅ Backend trả về hostName:", res.hostName);
          setHostName(res.hostName);
          setHostImageUrl(res.hostImageUrl);
        } else if (user) {
          // Nếu backend chưa trả về, dùng thông tin từ AuthContext (nếu có user đang login)
          console.log("✅ Backend chưa trả về hostName, dùng thông tin từ AuthContext");
          setHostName(user.fullName);
          setHostImageUrl(user.imageUrl);
        } else {
          // Fallback: Hiển thị Host ID
          console.warn("⚠️ Backend chưa trả về hostName và không có user đang login");
          setHostName(`Host #${res.hostId}`);
        }
      } catch (e) {
        setError("Không tìm thấy thông tin căn hộ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const PHOTOS = (data?.images ?? []).map((i) => i.imageUrl).filter(Boolean);

  const handleOpenModal = (index: number) => {
    setIsOpen(true);
    setOpenFocusIndex(index);
  };
  const handleCloseModal = () => setIsOpen(false);

  if (loading) return <div className="p-8 text-xl font-semibold">Đang tải...</div>;
  if (error || !data) return <div className="p-8 text-red-600">{error || "Lỗi dữ liệu!"}</div>;

  const renderSectionHeader = () => (
    <header className="container 2xl:px-14 rounded-md sm:rounded-xl">
      <div className="relative grid grid-cols-4 gap-1 sm:gap-2">
        <div
          className="col-span-3 row-span-3 relative rounded-md sm:rounded-xl overflow-hidden cursor-pointer"
          onClick={() => handleOpenModal(0)}
        >
          <NcImage
            containerClassName="absolute inset-0"
            className="object-cover w-full h-full rounded-md sm:rounded-xl"
            src={PHOTOS[0] || "/images/placeholder-large.png"}
          />
          <div className="absolute inset-0 bg-neutral-900 bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity"></div>
        </div>
        {(PHOTOS.length ? PHOTOS : ["", "", ""]).filter((_, i) => i >= 1 && i < 4).map((item, index) => (
          <div key={index} className={`relative rounded-md sm:rounded-xl overflow-hidden ${index >= 2 ? "block" : ""}`}>
            <NcImage
              containerClassName="aspect-w-4 aspect-h-3"
              className="object-cover w-full h-full rounded-md sm:rounded-xl "
              src={item || "/images/placeholder.png"}
            />
            <div
              className="absolute inset-0 bg-neutral-900 bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => handleOpenModal(index + 1)}
            />
          </div>
        ))}
        <div
          className="absolute hidden md:flex md:items-center md:justify-center left-3 bottom-3 px-4 py-2 rounded-xl bg-neutral-100 text-neutral-500 cursor-pointer hover:bg-neutral-200 z-10"
          onClick={() => handleOpenModal(0)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="ml-2 text-neutral-800 text-sm font-medium">Show all photos</span>
        </div>
      </div>
      <ModalPhotos imgs={PHOTOS} isOpen={isOpen} onClose={handleCloseModal} initFocus={openFocusIndex} uniqueClassName="nc-ListingStayDetailPage__modalPhotos" />
    </header>
  );

  const renderSectionIntro = () => (
      <div className="listingSection__wrap !space-y-6">
        <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <StartRating />
          <span>·</span>
          <span>
            <i className="las la-map-marker-alt"></i>
            <span className="ml-1">Resort ID: {data.resortId || "—"}</span>
          </span>
        </div>
        <LikeSaveBtns />
        </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">{data.name}</h2>
      <div className="text-neutral-6000 dark:text-neutral-300">{data.description || "Mô tả đang cập nhật."}</div>
        <div className="w-full border-b border-neutral-100 dark:border-neutral-700" />
        <div className="flex items-center justify-between xl:justify-start space-x-8 xl:space-x-12 text-sm text-neutral-700 dark:text-neutral-300">
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 "><i className="las la-bed text-2xl"></i><span>{data.beds} beds</span></div>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 "><i className="las la-bath text-2xl"></i><span>{data.bathrooms} bathrooms</span></div>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 "><i className="las la-tag text-2xl"></i><span>{data.pricePerNight?.toLocaleString()} đ / đêm</span></div>
        </div>
      </div>
    );

  const renderAmenities = () => (
      <div className="listingSection__wrap">
      <h2 className="text-2xl font-semibold">Tiện ích & Tiện nghi</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-neutral-700 dark:text-neutral-300 ">
        <div>
          <h4 className="font-semibold mb-2">Tiện ích</h4>
        <div>
            {data.amenities?.length ? (
              data.amenities.map((a) => a.name).join(", ")
            ) : (
              "—"
            )}
                  </div>
                </div>
        <div>
          <h4 className="font-semibold mb-2">Tiện nghi</h4>
        <div>
            {data.utilities?.length ? (
              data.utilities.map((u) => u.name).join(", ")
            ) : (
              "—"
            )}
            </div>
          </div>
        </div>
      </div>
    );

  const renderHost = () => {
    const finalHostName = hostName || data.hostName || `Host #${data.hostId}`;
    const finalHostImageUrl = hostImageUrl || data.hostImageUrl || user?.imageUrl;
    
    return (
      <div className="listingSection__wrap">
        <h2 className="text-2xl font-semibold">Host Information</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div className="flex items-center space-x-4">
          <Avatar
            hasChecked
            hasCheckedClass="w-4 h-4 -top-0.5 right-0.5"
            sizeClass="h-14 w-14"
            radius="rounded-full"
            imgUrl={finalHostImageUrl || undefined}
            userName={finalHostName}
          />
          <div>
            <div className="block text-xl font-medium">{finalHostName}</div>
            <div className="mt-1.5 flex items-center text-sm text-neutral-500 dark:text-neutral-400">
              <StartRating /><span className="mx-2">·</span><span> Verified Host</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReviews = () => (
      <div className="listingSection__wrap">
      <h2 className="text-2xl font-semibold">Reviews</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        <div className="space-y-5">
          <FiveStartIconForRate iconClass="w-6 h-6" className="space-x-0.5" />
          <div className="relative">
          <Input fontClass="" sizeClass="h-16 px-4 py-3" rounded="rounded-3xl" placeholder="Share your thoughts ..." />
          <ButtonCircle className="absolute right-2 top-1/2 transform -translate-y-1/2" size=" w-12 h-12 "><ArrowRightIcon className="w-5 h-5" /></ButtonCircle>
          </div>
        </div>
      </div>
    );

  const renderSidebar = () => (
      <div className="listingSectionSidebar__wrap shadow-xl">
        <div className="flex justify-between">
          <span className="text-3xl font-semibold">
          {data.pricePerNight?.toLocaleString()} đ
          <span className="ml-1 text-base font-normal text-neutral-500 dark:text-neutral-400">/đêm</span>
          </span>
          <StartRating />
        </div>
      <div className="flex flex-col space-y-4 mt-4">
        <div className="flex justify-between text-neutral-6000 dark:text-neutral-300"><span>Giường</span><span>{data.beds}</span></div>
        <div className="flex justify-between text-neutral-6000 dark:text-neutral-300"><span>Phòng tắm</span><span>{data.bathrooms}</span></div>
          <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
        <div className="flex justify-between font-semibold"><span>Tổng</span><span>{data.pricePerNight?.toLocaleString()} đ</span></div>
          </div>
      <ButtonPrimary className="mt-4">Đặt ngay</ButtonPrimary>
      <ButtonSecondary className="mt-2" href="/listing-stay">Xem thêm chỗ ở</ButtonSecondary>
      </div>
    );

  return (
    <div className={`ListingDetailPage nc-ListingStayDetailPage`} data-nc-id="ListingStayDetailPage">
      {renderSectionHeader()}
      <main className="container relative z-10 mt-11 flex flex-col lg:flex-row ">
        <div className="w-full lg:w-3/5 xl:w-2/3 space-y-8 lg:pr-10 lg:space-y-10">
          {renderSectionIntro()}
          {renderAmenities()}
          {data.details?.length ? (
            <div className="listingSection__wrap">
              <h2 className="text-2xl font-semibold">Chi tiết phòng</h2>
              <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
              <div className="space-y-3">
                {data.details?.map((d, i) => (
                  <div key={i} className="border rounded p-3">
                    <div><b>Tòa nhà:</b> {d.buildingName || "—"} · <b>Phòng:</b> {d.roomNumber || "—"}</div>
                    <div><b>Giường:</b> {d.beds} · <b>Phòng tắm:</b> {d.bathrooms}</div>
                    {d.safetyFeatures && <div><b>An toàn:</b> {d.safetyFeatures}</div>}
                    {d.hygieneStandards && <div><b>Vệ sinh:</b> {d.hygieneStandards}</div>}
              </div>
            ))}
            </div>
          </div>
          ) : null}
          {renderHost()}
          {renderReviews()}
        </div>
        <div className="hidden lg:block flex-grow mt-14 lg:mt-0">
          <div className="sticky top-28">{renderSidebar()}</div>
        </div>
      </main>
      <MobileFooterSticky />
        <div className="container py-24 lg:py-32">
          <div className="relative py-16">
            <BackgroundSection />
            <SectionSliderNewCategories
            heading="Explore by types of stays"
            subHeading="Explore houses based on 10 types of stays"
              categoryCardType="card5"
              itemPerRow={5}
              sliderStyle="style2"
            uniqueClassName="ListingStayDetailPage"
            />
          </div>
          <SectionSubscribe2 className="pt-24 lg:pt-32" />
        </div>
    </div>
  );
};

export default ListingStayDetailPage;