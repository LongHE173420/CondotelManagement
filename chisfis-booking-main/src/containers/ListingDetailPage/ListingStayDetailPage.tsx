import React, { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import condotelAPI, { CondotelDetailDTO } from "api/condotel";
import { useAuth } from "contexts/AuthContext";
import reviewAPI, { ReviewDTO } from "api/review";
import bookingAPI from "api/booking";
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
import Avatar from "shared/Avatar/Avatar";
import MobileFooterSticky from "./MobileFooterSticky";
import moment from "moment";
import ModalSelectDate from "components/ModalSelectDate";
import { DateRage } from "components/HeroSearchForm/StaySearchForm";
import { GuestsObject } from "components/HeroSearchForm2Mobile/GuestsInput";
import converSelectedDateToString from "utils/converSelectedDateToString";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "i18n/LanguageContext";
import { calculateFinalPrice } from "utils/priceCalculator";
import { toastWarning, toastError, showValidationError } from "utils/toast";
import { useChat } from "api/useChat";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};


const ListingStayDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<CondotelDetailDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [openFocusIndex, setOpenFocusIndex] = useState(0);
  const [hostName, setHostName] = useState<string>("");
  const [hostImageUrl, setHostImageUrl] = useState<string | undefined>(undefined);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [canWriteReview, setCanWriteReview] = useState<boolean>(false);
  const [reviewableBookingId, setReviewableBookingId] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewsPage, setReviewsPage] = useState<number>(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState<number>(1);
  const [reviewsTotalCount, setReviewsTotalCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [amenities, setAmenities] = useState<any[]>([]);
  const [utilities, setUtilities] = useState<any[]>([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState<boolean>(false);
  const { openChatWithCondotelHost, isConnected } = useChat(user?.userId || 0);
  const [rangeDates, setRangeDates] = useState<DateRage>({
    startDate: moment().add(1, "day"),
    endDate: moment().add(5, "days"),
  });
  const [guests, setGuests] = useState<GuestsObject>({
    guestAdults: 2,
    guestChildren: 0,
    guestInfants: 0,
  });

  // Load amenities and utilities from new API endpoints
  const loadAmenitiesAndUtilities = async (condotelId: number) => {
    try {
      setAmenitiesLoading(true);

      // Sử dụng endpoint amenities-utilities để tối ưu (chỉ 1 request)
      const result = await condotelAPI.getAmenitiesAndUtilitiesByCondotelId(condotelId);

      setAmenities(result.amenities || []);
      setUtilities(result.utilities || []);
    } catch (err: any) {
      // Nếu lỗi 404, có thể condotel không tồn tại hoặc chưa có amenities/utilities
      if (err.response?.status === 404) {
        setAmenities([]);
        setUtilities([]);
      } else {
        // Lỗi khác, giữ mảng rỗng
        setAmenities([]);
        setUtilities([]);
      }
    } finally {
      setAmenitiesLoading(false);
    }
  };

  const loadReviews = async (condotelId: number, page: number = 1, sort: string = "newest") => {
    try {
      setReviewsLoading(true);
      const response = await reviewAPI.getReviewsByCondotel(condotelId, {
        page,
        pageSize: 5, // Hiển thị 5 reviews mỗi trang
        sortBy: sort,
      });
      setReviews(response.data || []);
      setReviewsTotalPages(response.pagination?.totalPages || 1);
      setReviewsTotalCount(response.pagination?.totalCount || response.data?.length || 0);

      // Tính average rating từ tất cả reviews (cần load tất cả để tính chính xác)
      // Hoặc dùng từ response nếu backend trả về
      if (response.data && response.data.length > 0) {
        const totalRating = response.data.reduce((sum: number, r: any) => sum + r.rating, 0);
        setAverageRating(totalRating / response.data.length);
      }
    } catch (err: any) {
      // 404 is expected if there are no reviews - don't log as error
      if (err.response?.status === 404) {
      } else {
      }
      // Không set error, chỉ log - reviews có thể không có
      setReviews([]);
      setReviewsTotalPages(1);
      setReviewsTotalCount(0);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkCanWriteReview = async (condotelId: number) => {
    try {
      // Lấy tất cả bookings của user
      const myBookings = await bookingAPI.getMyBookings();

      // Tìm booking có status "Completed" cho condotel này
      // Chỉ cho phép review khi booking status là "Completed"
      const completedBooking = myBookings.find(
        (b: any) => {
          const status = b.status?.toLowerCase();
          return b.condotelId === condotelId && status === "completed";
        }
      );

      if (completedBooking) {
        // Backend đã xóa endpoint can-review, logic kiểm tra được tích hợp vào CreateReview
        // Ở đây chỉ cần kiểm tra booking status là "Completed"
        // Nếu đã review rồi, backend sẽ trả về lỗi khi submit review
        setCanWriteReview(true);
        setReviewableBookingId(completedBooking.bookingId);
      } else {
        // Không có booking completed cho condotel này
        setCanWriteReview(false);
        setReviewableBookingId(null);
      }
    } catch (err: any) {
      // Nếu lỗi, không cho phép review
      setCanWriteReview(false);
      setReviewableBookingId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("Không tìm thấy ID căn hộ");
          return;
        }
        const condotelId = Number(id);
        const res = await condotelAPI.getById(condotelId);
        setData(res);

        // Luôn ưu tiên hostName từ backend - không dùng tên user đang login
        if (res.hostName) {
          setHostName(res.hostName);
          setHostImageUrl(res.hostImageUrl);
        } else {
          // Nếu backend không trả về hostName, chỉ dùng Host ID làm fallback
          // KHÔNG dùng tên user đang login vì user có thể là tenant, không phải host
          setHostName(`Host #${res.hostId}`);
          setHostImageUrl(undefined);
        }

        // Load amenities và utilities từ API mới (không block nếu lỗi)
        loadAmenitiesAndUtilities(condotelId).catch((err) => {
          // Không throw error, chỉ log - amenities/utilities là optional
        });

        // Load reviews cho condotel này
        await loadReviews(condotelId, reviewsPage, sortBy);

        // Kiểm tra nếu user đã đăng nhập và có booking completed cho condotel này
        if (user) {
          await checkCanWriteReview(condotelId);
        }
      } catch (e: any) {
        setError("Không tìm thấy thông tin căn hộ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  // Reload reviews when page or sort changes
  useEffect(() => {
    if (id && data) {
      loadReviews(Number(id), reviewsPage, sortBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewsPage, sortBy]);

  const PHOTOS = (data?.images ?? []).map((i: any) => i.imageUrl).filter(Boolean);

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
        {(PHOTOS.length ? PHOTOS : ["", "", ""]).filter((_: any, i: number) => i >= 1 && i < 4).map((item: string, index: number) => (
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

  const renderSectionIntro = () => {
    // Logic tính giá:
    // 1. Nếu activePrice không null và hợp lệ (trong khoảng thời gian) -> dùng activePrice.basePrice
    // 2. Nếu không có activePrice hoặc không hợp lệ -> dùng pricePerNight
    // 3. Sau đó áp dụng promotion (nếu có) lên giá base đã chọn
    const checkInDate = rangeDates.startDate;
    const checkOutDate = rangeDates.endDate;

    // Lấy available promotion cho dates đã chọn
    const availablePromotion = getAvailablePromotion();

    // calculateFinalPrice sẽ tự động ưu tiên activePrice nếu có, không thì dùng pricePerNight
    const { basePrice: basePricePerNight, finalPrice: finalPricePerNight, discountAmount } = calculateFinalPrice(
      data.pricePerNight || 0,
      data.activePrice || null,
      availablePromotion,
      checkInDate || undefined,
      checkOutDate || undefined
    );

    const hasDiscount = discountAmount > 0;

    return (
      <div className="listingSection__wrap !space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <StartRating point={averageRating > 0 ? Number(averageRating.toFixed(1)) : 0} reviewCount={reviewsTotalCount} />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">{data.name}</h2>
        <div className="text-neutral-6000 dark:text-neutral-300">{data.description || "Mô tả đang cập nhật."}</div>
        {(data.resortAddress || (data as any).address || (data as any).Address) && (
          <div className="flex items-center space-x-2 text-neutral-6000 dark:text-neutral-300">
            <i className="las la-map-marker text-xl"></i>
            <span>{data.resortAddress || (data as any).address || (data as any).Address}</span>
          </div>
        )}
        <div className="w-full border-b border-neutral-100 dark:border-neutral-700" />
        <div className="flex items-center justify-between xl:justify-start space-x-8 xl:space-x-12 text-sm text-neutral-700 dark:text-neutral-300">
          {data.resortName && (
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3">
              <i className="las la-building text-2xl"></i>
              <span>{data.resortName}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 "><i className="las la-bath text-2xl"></i><span>{data.bathrooms} bathrooms</span></div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 text-center sm:text-left sm:space-x-3 ">
            <i className="las la-tag text-2xl"></i>
            <div className="flex flex-col items-center sm:items-start">
              {hasDiscount ? (
                <>
                  <span className="text-base font-semibold text-red-600 dark:text-red-400">
                    {formatPrice(finalPricePerNight)}
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
                      /đêm
                    </span>
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">
                    {formatPrice(basePricePerNight)}
                  </span>
                </>
              ) : (
                <span className="text-base font-semibold">
                  {formatPrice(basePricePerNight)}
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
                    /đêm
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function để lấy icon cho amenity/utility
  const getAmenityIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("wifi") || nameLower.includes("internet")) {
      return "las la-wifi";
    } else if (nameLower.includes("parking") || nameLower.includes("đỗ xe")) {
      return "las la-parking";
    } else if (nameLower.includes("pool") || nameLower.includes("bể bơi")) {
      return "las la-swimming-pool";
    } else if (nameLower.includes("gym") || nameLower.includes("phòng gym")) {
      return "las la-dumbbell";
    } else if (nameLower.includes("kitchen") || nameLower.includes("bếp")) {
      return "las la-utensils";
    } else if (nameLower.includes("tv") || nameLower.includes("tivi")) {
      return "las la-tv";
    } else if (nameLower.includes("air") || nameLower.includes("điều hòa")) {
      return "las la-wind";
    } else if (nameLower.includes("elevator") || nameLower.includes("thang máy")) {
      return "las la-arrow-up";
    } else if (nameLower.includes("security") || nameLower.includes("an ninh")) {
      return "las la-shield-alt";
    } else if (nameLower.includes("laundry") || nameLower.includes("giặt")) {
      return "las la-tshirt";
    } else if (nameLower.includes("balcony") || nameLower.includes("ban công")) {
      return "las la-home";
    } else if (nameLower.includes("beach") || nameLower.includes("biển")) {
      return "las la-umbrella-beach";
    } else {
      return "las la-check-circle";
    }
  };

  const getUtilityIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("bed") || nameLower.includes("giường")) {
      return "las la-bed";
    } else if (nameLower.includes("bath") || nameLower.includes("phòng tắm")) {
      return "las la-bath";
    } else if (nameLower.includes("sofa") || nameLower.includes("ghế")) {
      return "las la-couch";
    } else if (nameLower.includes("table") || nameLower.includes("bàn")) {
      return "las la-table";
    } else if (nameLower.includes("wardrobe") || nameLower.includes("tủ")) {
      return "las la-archive";
    } else if (nameLower.includes("refrigerator") || nameLower.includes("tủ lạnh")) {
      return "las la-snowflake";
    } else if (nameLower.includes("microwave") || nameLower.includes("lò vi sóng")) {
      return "las la-fire";
    } else if (nameLower.includes("washing") || nameLower.includes("máy giặt")) {
      return "las la-tshirt";
    } else {
      return "las la-check";
    }
  };

  const renderAmenities = () => {
    if (!data) return null;

    return (
      <div className="listingSection__wrap">
        <h2 className="text-2xl font-semibold">Tiện ích & Tiện nghi</h2>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

        {amenitiesLoading ? (
          <div className="mt-6 py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-500 dark:text-neutral-400">Đang tải tiện ích và tiện nghi...</p>
          </div>
        ) : (
          <div className="space-y-8 mt-6">
            {/* Tiện ích */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
                Tiện ích
              </h4>
              {amenities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {amenities.map((amenity: any) => {
                    const amenityId = amenity.amenityId || amenity.AmenityId || amenity.Id || amenity.id;
                    const amenityName = amenity.name || amenity.Name || "";
                    return (
                      <div
                        key={amenityId}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <i className={`${getAmenityIcon(amenityName)} text-2xl text-primary-600 dark:text-primary-400`}></i>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {amenityName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 dark:text-neutral-400">Chưa có thông tin tiện ích</p>
              )}
            </div>

            {/* Tiện nghi */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
                Tiện nghi
              </h4>
              {utilities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {utilities.map((utility: any) => {
                    const utilityId = utility.utilityId || utility.UtilityId || utility.Id || utility.id;
                    const utilityName = utility.name || utility.Name || "";
                    return (
                      <div
                        key={utilityId}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <i className={`${getUtilityIcon(utilityName)} text-2xl text-primary-600 dark:text-primary-400`}></i>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {utilityName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 dark:text-neutral-400">Chưa có thông tin tiện nghi</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHost = () => {
    const finalHostName = hostName || data.hostName || `Host #${data.hostId}`;
    const finalHostImageUrl = hostImageUrl || data.hostImageUrl;

    return (
      <div className="listingSection__wrap">
        <h2 className="text-2xl font-semibold">{t.condotel.host || "Thông tin Host"}</h2>
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
              <StartRating point={averageRating > 0 ? Number(averageRating.toFixed(1)) : 0} reviewCount={reviewsTotalCount} /><span className="mx-2">·</span><span>Verified Host</span>
            </div>
          </div>

          {/* Nút Chat với Host - ĐÃ SỬA */}
          {data?.hostId && (
            <button
              onClick={async () => {
                if (!user) {
                  toastWarning("Vui lòng đăng nhập để chat với host");
                  navigate("/login");
                  return;
                }

                if (user.userId === data?.hostId) {
                  toastWarning("Bạn không thể chat với chính mình");
                  return;
                }

                if (!data?.condotelId) {
                  toastError("Không thể mở chat: thiếu thông tin căn hộ");
                  return;
                }

                // Thêm loading để người dùng biết đang xử lý
                const success = await openChatWithCondotelHost(data.condotelId);

                if (success) {
                  navigate("/chat"); // Chỉ navigate khi thành công
                }
                // Nếu thất bại thì toastError đã xử lý trong hàm rồi
              }}
              disabled={!isConnected}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
              title="Chat với host"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm font-medium">
                {isConnected ? "Chat với host" : "Đang kết nối..."}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderReviews = () => {
    const reviewCount = reviewsTotalCount || reviews.length;
    const displayRating = averageRating > 0 ? averageRating.toFixed(1) : "0.0";

    return (
      <div className="listingSection__wrap">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            Đánh giá {reviewCount > 0 && `(${reviewCount} ${reviewCount === 1 ? "đánh giá" : "đánh giá"})`}
          </h2>
          {reviewCount > 0 && (
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setReviewsPage(1); // Reset về trang 1 khi đổi sort
              }}
              className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Đánh giá cao nhất</option>
              <option value="lowest">Đánh giá thấp nhất</option>
            </select>
          )}
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700 mb-6"></div>

        {reviewsLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải đánh giá...</p>
          </div>
        ) : (
          <>
            {reviewCount > 0 && (
              <div className="mb-6 flex items-center space-x-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{displayRating}</span>
                  <FiveStartIconForRate iconClass="w-6 h-6" className="space-x-0.5 ml-2" />
                </div>
                <div className="h-8 w-px bg-neutral-300 dark:bg-neutral-600"></div>
                <div className="flex flex-col">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {reviewCount} {reviewCount === 1 ? "đánh giá" : "đánh giá"}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-500">
                    Dựa trên {reviewCount} đánh giá
                  </span>
                </div>
              </div>
            )}

            {/* Nút viết review cho tenant đã đặt phòng thành công */}
            {canWriteReview && reviewableBookingId && (
              <div className="mb-6">
                <ButtonPrimary
                  onClick={() => navigate(`/write-review/${reviewableBookingId}`)}
                  className="w-full sm:w-auto"
                >
                  ✍️ Viết đánh giá
                </ButtonPrimary>
              </div>
            )}

            {/* Hiển thị danh sách reviews */}
            {reviewCount > 0 ? (
              <>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {reviews.map((review) => (
                    <div key={review.reviewId} className="py-6 first:pt-0">
                      <div className="flex space-x-4">
                        <div className="pt-0.5 flex-shrink-0">
                          <Avatar
                            sizeClass="h-12 w-12 text-lg"
                            radius="rounded-full"
                            userName={review.userFullName || review.customerName || "Anonymous"}
                            imgUrl={review.userImageUrl || review.customerImageUrl}
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start space-x-3 mb-2">
                            <div className="flex flex-col min-w-0">
                              <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                {review.userFullName || review.customerName || "Anonymous"}
                              </div>
                              <span className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {review.createdAt
                                  ? moment(review.createdAt).format("DD [tháng] MM, YYYY")
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex text-yellow-500 flex-shrink-0">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-5 h-5 ${star <= review.rating ? "fill-current" : "fill-none stroke-current stroke-1"
                                    }`}
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          {review.title && (
                            <h4 className="mt-2 mb-2 font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                              {review.title}
                            </h4>
                          )}
                          {review.comment && (
                            <p className="mt-2 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                              {review.comment}
                            </p>
                          )}
                          {/* Hiển thị reply nếu có */}
                          {review.reply && (
                            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 rounded-r-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                  Phản hồi từ Host:
                                </span>
                              </div>
                              <p className="text-neutral-700 dark:text-neutral-300">
                                {review.reply}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {reviewsTotalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-2 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                      disabled={reviewsPage === 1 || reviewsLoading}
                      className="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Trước
                    </button>
                    <span className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">
                      Trang {reviewsPage} / {reviewsTotalPages}
                    </span>
                    <button
                      onClick={() => setReviewsPage((p) => Math.min(reviewsTotalPages, p + 1))}
                      disabled={reviewsPage === reviewsTotalPages || reviewsLoading}
                      className="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <svg
                  className="w-16 h-16 text-neutral-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-2">
                  {user && canWriteReview
                    ? "Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!"
                    : "Chưa có đánh giá nào cho căn hộ này."}
                </p>
                {user && canWriteReview && reviewableBookingId && (
                  <ButtonPrimary
                    onClick={() => navigate(`/write-review/${reviewableBookingId}`)}
                    className="mt-4"
                  >
                    Viết đánh giá đầu tiên
                  </ButtonPrimary>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const handleBooking = () => {
    // Kiểm tra user đã đăng nhập chưa
    if (!user) {
      toastWarning("Vui lòng đăng nhập để đặt phòng");
      navigate("/login");
      return;
    }

    // Kiểm tra đã chọn ngày chưa
    if (!rangeDates.startDate || !rangeDates.endDate) {
      showValidationError("Vui lòng chọn ngày check-in và check-out");
      return;
    }

    // Tính số đêm
    const nights = rangeDates.endDate.diff(rangeDates.startDate, "days");
    if (nights <= 0) {
      showValidationError("Ngày check-out phải sau ngày check-in");
      return;
    }

    // Get available promotion for selected dates
    const availablePromotion = getAvailablePromotion();

    // Tính giá cơ bản cho 1 đêm (có thể từ activePrice hoặc pricePerNight)
    const checkInDate = rangeDates.startDate;
    const checkOutDate = rangeDates.endDate;
    // Tính giá base: ưu tiên activePrice nếu có và hợp lệ, không thì dùng pricePerNight
    const { basePrice: basePricePerNight } = calculateFinalPrice(
      data.pricePerNight || 0,
      data.activePrice || null,
      null, // Chưa áp dụng promotion ở đây, sẽ áp dụng ở checkout
      checkInDate || undefined,
      checkOutDate || undefined
    );

    // Navigate đến checkout page với state
    navigate("/checkout", {
      state: {
        condotelId: data.condotelId,
        condotelName: data.name,
        condotelImageUrl: data.images?.[0]?.imageUrl,
        pricePerNight: basePricePerNight, // Dùng basePricePerNight thay vì pricePerNight
        startDate: rangeDates.startDate.format("YYYY-MM-DD"),
        endDate: rangeDates.endDate.format("YYYY-MM-DD"),
        guests: guests,
        nights: nights,
        activePromotionId: availablePromotion?.promotionId || null, // Pass promotion ID để pre-select
      },
    });
  };

  // Calculate price with promotion
  const calculatePriceWithPromotion = (basePrice: number, promotion: any | null): number => {
    if (!promotion) return basePrice;

    if (promotion.discountPercentage) {
      return basePrice * (1 - promotion.discountPercentage / 100);
    } else if (promotion.discountAmount) {
      return Math.max(0, basePrice - promotion.discountAmount);
    }

    return basePrice;
  };

  // Get available promotion for selected dates
  const getAvailablePromotion = () => {
    if (!data || !rangeDates.startDate || !rangeDates.endDate) return null;

    const startDate = rangeDates.startDate.format("YYYY-MM-DD");
    const endDate = rangeDates.endDate.format("YYYY-MM-DD");

    // Check activePromotion first
    if (data.activePromotion) {
      const promo = data.activePromotion;
      const promoStart = moment(promo.startDate).format("YYYY-MM-DD");
      const promoEnd = moment(promo.endDate).format("YYYY-MM-DD");

      // Check dates overlap
      if (startDate <= promoEnd && endDate >= promoStart) {
        return promo;
      }
    }

    // Check promotions list
    if (data.promotions && Array.isArray(data.promotions)) {
      for (const promo of data.promotions) {
        const promoStart = moment(promo.startDate).format("YYYY-MM-DD");
        const promoEnd = moment(promo.endDate).format("YYYY-MM-DD");

        // Check dates overlap first
        if (!(startDate <= promoEnd && endDate >= promoStart)) {
          continue;
        }

        // If booking dates are fully within promotion period, consider it active
        const bookingWithinPromotion = startDate >= promoStart && endDate <= promoEnd;
        if (bookingWithinPromotion) {
          return promo;
        }

        // Otherwise, check if promotion is active
        // If status/isActive is not set, check if current date is within promotion period
        const today = moment().format("YYYY-MM-DD");
        const isCurrentlyActive = today >= promoStart && today <= promoEnd;

        const isActive =
          promo.status === "Active" ||
          promo.isActive === true ||
          (promo.status === null && promo.isActive === false && isCurrentlyActive); // If backend doesn't set status, check dates

        if (!isActive) {
          continue;
        }

        return promo;
      }
    }

    return null;
  };

  const renderSidebar = () => {
    // Tính số đêm
    const nights = rangeDates.startDate && rangeDates.endDate
      ? rangeDates.endDate.diff(rangeDates.startDate, "days")
      : 0;

    // Tính giá cơ bản cho 1 đêm (có thể từ activePrice hoặc pricePerNight)
    const checkInDate = rangeDates.startDate;
    const checkOutDate = rangeDates.endDate;

    // Get available promotion
    const availablePromotion = getAvailablePromotion();

    // Tính giá cho 1 đêm:
    // - Ưu tiên activePrice nếu không null và hợp lệ trong khoảng thời gian
    // - Nếu không có activePrice hoặc không hợp lệ, dùng pricePerNight
    // - Sau đó áp dụng promotion (nếu có)
    const { basePrice: basePricePerNight, finalPrice: finalPricePerNight } = calculateFinalPrice(
      data.pricePerNight || 0,
      data.activePrice || null,
      availablePromotion,
      checkInDate || undefined,
      checkOutDate || undefined
    );

    // Debug log

    // Tính tổng tiền cho tất cả các đêm
    const baseTotalPrice = nights > 0 ? nights * basePricePerNight : 0;
    const totalPrice = nights > 0 ? nights * finalPricePerNight : 0;
    const discountAmount = baseTotalPrice - totalPrice;

    return (
      <div className="listingSectionSidebar__wrap shadow-xl">
        <div className="flex justify-between">
          <div className="flex flex-col">
            {discountAmount > 0 && nights > 0 ? (
              <>
                <span className="text-3xl font-semibold text-red-600 dark:text-red-400">
                  {formatPrice(finalPricePerNight)}
                  <span className="ml-1 text-base font-normal text-neutral-500 dark:text-neutral-400">/đêm</span>
                </span>
                <span className="text-sm text-neutral-400 dark:text-neutral-500 line-through">
                  {formatPrice(basePricePerNight)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-semibold">
                {formatPrice(basePricePerNight)}
                <span className="ml-1 text-base font-normal text-neutral-500 dark:text-neutral-400">/đêm</span>
              </span>
            )}
            {availablePromotion && discountAmount > 0 && (
              <span className="mt-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded inline-block w-fit">
                {availablePromotion.discountPercentage
                  ? `-${availablePromotion.discountPercentage}%`
                  : availablePromotion.discountAmount
                    ? `-${formatPrice(availablePromotion.discountAmount)}`
                    : "Khuyến mãi"}
              </span>
            )}
          </div>
          <StartRating point={averageRating > 0 ? Number(averageRating.toFixed(1)) : 0} reviewCount={reviewsTotalCount} />
        </div>

        {/* Form chọn ngày và số khách */}
        <div className="mt-4 space-y-4">
          {/* Chọn ngày */}
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
            <ModalSelectDate
              defaultValue={rangeDates}
              onSelectDate={setRangeDates}
              renderChildren={({ openModal }) => (
                <button
                  onClick={openModal}
                  className="text-left w-full p-4 flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  type="button"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-400">Ngày</span>
                    <span className="mt-1.5 text-base font-semibold">
                      {rangeDates.startDate && rangeDates.endDate
                        ? converSelectedDateToString(rangeDates)
                        : "Chọn ngày check-in / check-out"}
                    </span>
                  </div>
                  <PencilSquareIcon className="w-5 h-5 text-neutral-6000 dark:text-neutral-400" />
                </button>
              )}
            />
          </div>
        </div>

        {/* Chi tiết giá */}
        <div className="flex flex-col space-y-4 mt-4">
          <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
            <span>Giường</span>
            <span>{data.beds}</span>
          </div>
          <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
            <span>Phòng tắm</span>
            <span>{data.bathrooms}</span>
          </div>
          {rangeDates.startDate && (
            <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
              <span>Nhận Phòng</span>
              <span>{rangeDates.startDate.format("DD-MM-YYYY")}(14:00)</span>
            </div>
          )}
          {rangeDates.endDate && (
            <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
              <span>Trả Phòng</span>
              <span>{rangeDates.endDate.format("DD-MM-YYYY")}(12:00)</span>
            </div>
          )}
          {nights > 0 && (
            <>
              <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
              <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
                <span>
                  {formatPrice(basePricePerNight)} x {nights} đêm
                </span>
                <span>{formatPrice(baseTotalPrice)}</span>
              </div>
              {availablePromotion && discountAmount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>
                    Giảm giá {availablePromotion.discountPercentage
                      ? `(${availablePromotion.discountPercentage}%)`
                      : availablePromotion.discountAmount
                        ? `(${formatPrice(availablePromotion.discountAmount)})`
                        : ""}
                  </span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
            </>
          )}
          <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
          <div className="flex justify-between font-semibold">
            <span>Tổng</span>
            <span className={availablePromotion && discountAmount > 0 ? "text-red-600 dark:text-red-400" : ""}>
              {formatPrice(totalPrice > 0 ? totalPrice : baseTotalPrice)}
            </span>
          </div>
        </div>

        <ButtonPrimary className="mt-4" onClick={handleBooking}>
          Đặt ngay
        </ButtonPrimary>
        <ButtonSecondary className="mt-2" href="/listing-stay">
          {t.condotel.viewMore || "Xem thêm chỗ ở"}
        </ButtonSecondary>
      </div>
    );
  };

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
                {data.details?.map((d: any, i: number) => (
                  <div key={i} className="border rounded p-3">
                    <div><b>Tòa nhà:</b> {d.buildingName || "—"} · <b>Phòng:</b> {d.roomNumber || "—"}</div>
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