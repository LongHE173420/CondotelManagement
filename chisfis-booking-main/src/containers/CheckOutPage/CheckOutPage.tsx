import { Tab } from "@headlessui/react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import React, { FC, Fragment, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import visaPng from "images/vis.png";
import mastercardPng from "images/mastercard.svg";
import Input from "shared/Input/Input";
import Label from "components/Label/Label";
import Textarea from "shared/Textarea/Textarea";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import NcImage from "shared/NcImage/NcImage";
import StartRating from "components/StartRating/StartRating";
import NcModal from "shared/NcModal/NcModal";
import ModalSelectDate from "components/ModalSelectDate";
import moment from "moment";
import { DateRage } from "components/HeroSearchForm/StaySearchForm";
import converSelectedDateToString from "utils/converSelectedDateToString";
import ModalSelectGuests from "components/ModalSelectGuests";
import { GuestsObject } from "components/HeroSearchForm2Mobile/GuestsInput";
import { useAuth } from "contexts/AuthContext";
import bookingAPI, { CreateBookingDTO } from "api/booking";
import paymentAPI from "api/payment";
import condotelAPI from "api/condotel";

export interface CheckOutPageProps {
  className?: string;
}

interface CheckoutState {
  condotelId?: number;
  condotelName?: string;
  condotelImageUrl?: string;
  pricePerNight?: number;
  startDate?: string;
  endDate?: string;
  guests?: GuestsObject;
  nights?: number;
}

const CheckOutPage: FC<CheckOutPageProps> = ({ className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as CheckoutState | null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);

  // Initialize dates from state or default
  const [rangeDates, setRangeDates] = useState<DateRage>(() => {
    if (state?.startDate && state?.endDate) {
      return {
        startDate: moment(state.startDate),
        endDate: moment(state.endDate),
      };
    }
    return {
      startDate: moment().add(1, "day"),
      endDate: moment().add(5, "days"),
    };
  });

  // Initialize guests from state or default
  const [guests, setGuests] = useState<GuestsObject>(() => {
    return state?.guests || {
      guestAdults: 2,
      guestChildren: 1,
      guestInfants: 1,
    };
  });

  // Redirect if no state (user came directly to checkout without selecting condotel)
  useEffect(() => {
    if (!state || !state.condotelId) {
      // Optionally redirect to listing page
      // navigate("/listing-stay");
    }
  }, [state, navigate]);

  // Handle payment
  const handlePayment = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để đặt phòng");
      navigate("/login");
      return;
    }

    if (!state?.condotelId) {
      alert("Vui lòng chọn căn hộ để đặt phòng");
      return;
    }

    if (!rangeDates.startDate || !rangeDates.endDate) {
      alert("Vui lòng chọn ngày check-in và check-out");
      return;
    }

    const nights = rangeDates.endDate.diff(rangeDates.startDate, "days");
    if (nights <= 0) {
      alert("Ngày check-out phải sau ngày check-in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure we have condotelName - fetch if missing
      let condotelName = state?.condotelName;
      if (!condotelName && state?.condotelId) {
        try {
          const condotelDetail = await condotelAPI.getById(state.condotelId);
          condotelName = condotelDetail.name;
        } catch (err) {
          console.warn("Could not fetch condotel name:", err);
        }
      }

      if (!condotelName) {
        setError("Không thể lấy thông tin căn hộ. Vui lòng thử lại.");
        setLoading(false);
        return;
      }

      const startDateStr = rangeDates.startDate.format("YYYY-MM-DD");
      const endDateStr = rangeDates.endDate.format("YYYY-MM-DD");

      // Step 0: Check availability before creating booking
      try {
        console.log("🔍 Checking availability...");
        const availability = await bookingAPI.checkAvailability(
          state.condotelId!,
          startDateStr,
          endDateStr
        );
        
        if (!availability.available) {
          setError("Căn hộ không khả dụng trong khoảng thời gian đã chọn. Vui lòng chọn ngày khác.");
          setLoading(false);
          return;
        }
        console.log("✅ Condotel is available for selected dates");
      } catch (availabilityErr: any) {
        // If availability check fails, still try to create booking (backend will validate)
        console.warn("⚠️ Could not check availability, proceeding with booking:", availabilityErr);
      }

      // Step 1: Tạo booking
      const bookingData: CreateBookingDTO = {
        condotelId: state.condotelId!,
        startDate: startDateStr,
        endDate: endDateStr,
        status: "Pending", // Default status for new bookings
        condotelName: condotelName, // Required by backend validation
      };

      console.log("📤 Creating booking...");
      let booking = await bookingAPI.createBooking(bookingData);
      console.log("✅ Booking created:", booking);
      console.log("💰 Booking totalPrice:", booking.totalPrice);
      
      // Validate bookingId exists
      if (!booking.bookingId) {
        throw new Error("Booking created but BookingId is missing. Please try again.");
      }
      
      // If booking doesn't have totalPrice, try to fetch it again (backend might calculate it asynchronously)
      if (!booking.totalPrice || booking.totalPrice <= 0) {
        console.warn("⚠️ Booking created without totalPrice, fetching booking again...");
        try {
          // Wait a bit for backend to calculate totalPrice
          await new Promise(resolve => setTimeout(resolve, 500));
          booking = await bookingAPI.getBookingById(booking.bookingId);
          console.log("✅ Booking fetched again:", booking);
          console.log("💰 Booking totalPrice after fetch:", booking.totalPrice);
        } catch (fetchError) {
          console.error("❌ Error fetching booking:", fetchError);
        }
      }
      
      // Validate booking has totalPrice (required for PayOS)
      if (!booking.totalPrice || booking.totalPrice <= 0) {
        throw new Error(
          "Booking chưa có tổng tiền (TotalPrice = 0 hoặc null). " +
          "Có thể backend chưa tính toán tổng tiền cho booking. " +
          "Vui lòng thử lại sau hoặc liên hệ hỗ trợ. " +
          `Booking ID: ${booking.bookingId}`
        );
      }
      
      setBookingId(booking.bookingId);

      // Step 2: Tạo payment link
      const returnUrl = `${window.location.origin}/pay-done?bookingId=${booking.bookingId}&status=success`;
      const cancelUrl = `${window.location.origin}/payment/cancel?bookingId=${booking.bookingId}&status=cancelled`;

      console.log("📤 Creating payment link for booking:", booking.bookingId);
      
      // PayOS requires description to be max 25 characters
      // Create a short description that fits within 25 characters
      const bookingIdStr = String(booking.bookingId);
      let description: string;
      
      // Try "Booking #123" format first (9 chars + bookingId length)
      const bookingPrefix = "Booking #";
      if (bookingPrefix.length + bookingIdStr.length <= 25) {
        description = `${bookingPrefix}${bookingIdStr}`;
      } else {
        // If too long, use just "#123" format (1 char + bookingId length)
        const hashPrefix = "#";
        if (hashPrefix.length + bookingIdStr.length <= 25) {
          description = `${hashPrefix}${bookingIdStr}`;
        } else {
          // If bookingId itself is too long, truncate it
          const maxIdLength = 25 - hashPrefix.length;
          description = `${hashPrefix}${bookingIdStr.substring(0, maxIdLength)}`;
        }
      }
      
      // Final safety check: ensure description is exactly 25 characters or less
      description = description.substring(0, 25);
      
      console.log(`📝 Payment description (${description.length} chars): "${description}"`);
      
      const paymentResponse = await paymentAPI.createPayment({
        bookingId: booking.bookingId,
        description: description,
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
      });

      console.log("✅ Payment link created:", paymentResponse);

      if (paymentResponse.data?.checkoutUrl) {
        // Step 3: Redirect đến PayOS checkout
        window.location.href = paymentResponse.data.checkoutUrl;
      } else {
        throw new Error(paymentResponse.desc || "Không thể tạo link thanh toán");
      }
    } catch (err: any) {
      console.error("❌ Payment error:", err);
      
      // Handle validation errors (400)
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        let errorMessage = "";
        
        // Prioritize message field (usually contains user-friendly messages)
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.errors) {
          // Check for validation errors
          errorMessage = "Có lỗi xảy ra khi tạo đặt phòng:\n";
          const validationErrors = Object.entries(errorData.errors)
            .map(([key, value]: [string, any]) => {
              if (Array.isArray(value)) {
                return `• ${key}: ${value.join(', ')}`;
              }
              return `• ${key}: ${value}`;
            })
            .join('\n');
          errorMessage += validationErrors;
        } else {
          errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đặt phòng.";
        }
        
        setError(errorMessage);
      } else if (err.response?.status === 404) {
        setError("Không tìm thấy căn hộ. Vui lòng thử lại.");
      } else if (err.response?.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại."
        );
      }
      
      setLoading(false);
    }
  };

  const renderSidebar = () => {
    // Calculate nights and total price
    const nights = state?.nights || (rangeDates.startDate && rangeDates.endDate
      ? rangeDates.endDate.diff(rangeDates.startDate, "days")
      : 0);
    const pricePerNight = state?.pricePerNight || 0;
    const totalPrice = nights * pricePerNight;

    return (
      <div className="w-full flex flex-col sm:rounded-2xl lg:border border-neutral-200 dark:border-neutral-700 space-y-6 sm:space-y-8 px-0 sm:p-6 xl:p-8">
        {state?.condotelId ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 w-full sm:w-40">
                <div className=" aspect-w-4 aspect-h-3 sm:aspect-h-4 rounded-2xl overflow-hidden">
                  <NcImage 
                    src={state.condotelImageUrl || "https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"} 
                    alt={state.condotelName}
                  />
                </div>
              </div>
              <div className="py-5 sm:px-5 space-y-3">
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                    Condotel
                  </span>
                  <span className="text-base font-medium mt-1 block">
                    {state.condotelName || "Căn hộ"}
                  </span>
                </div>
                <div className="w-10 border-b border-neutral-200  dark:border-neutral-700"></div>
                <StartRating />
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <h3 className="text-2xl font-semibold">Chi tiết giá</h3>
              {nights > 0 && pricePerNight > 0 && (
                <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
                  <span>{pricePerNight.toLocaleString()} đ x {nights} đêm</span>
                  <span>{(pricePerNight * nights).toLocaleString()} đ</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
                <span>Phí dịch vụ</span>
                <span>0 đ</span>
              </div>

              <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
              <div className="flex justify-between font-semibold">
                <span>Tổng cộng</span>
                <span>{totalPrice > 0 ? totalPrice.toLocaleString() : "0"} đ</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <p>Vui lòng chọn căn hộ để đặt phòng</p>
          </div>
        )}
      </div>
    );
  };

  const renderMain = () => {
    return (
      <div className="w-full flex flex-col sm:rounded-2xl sm:border border-neutral-200 dark:border-neutral-700 space-y-8 px-0 sm:p-6 xl:p-8">
        <h2 className="text-3xl lg:text-4xl font-semibold">
          Confirm and payment
        </h2>
        <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
        <div>
          <div>
            <h3 className="text-2xl font-semibold">Your trip</h3>
            <NcModal
              renderTrigger={(openModal) => (
                <span
                  onClick={() => openModal()}
                  className="block lg:hidden underline  mt-1 cursor-pointer"
                >
                  View booking details
                </span>
              )}
              renderContent={renderSidebar}
              modalTitle="Booking details"
            />
          </div>
          <div className="mt-6 border border-neutral-200 dark:border-neutral-700 rounded-3xl flex flex-col sm:flex-row divide-y sm:divide-x sm:divide-y-0 divide-neutral-200 dark:divide-neutral-700">
            <ModalSelectDate
              defaultValue={rangeDates}
              onSelectDate={setRangeDates}
              renderChildren={({ openModal }) => (
                <button
                  onClick={openModal}
                  className="text-left flex-1 p-5 flex justify-between space-x-5 "
                  type="button"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-400">Date</span>
                    <span className="mt-1.5 text-lg font-semibold">
                      {converSelectedDateToString(rangeDates)}
                    </span>
                  </div>
                  <PencilSquareIcon className="w-6 h-6 text-neutral-6000 dark:text-neutral-400" />
                </button>
              )}
            />

            <ModalSelectGuests
              defaultValue={guests}
              onChangeGuests={setGuests}
              renderChildren={({ openModal }) => (
                <button
                  type="button"
                  onClick={openModal}
                  className="text-left flex-1 p-5 flex justify-between space-x-5"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-400">Guests</span>
                    <span className="mt-1.5 text-lg font-semibold">
                      <span className="line-clamp-1">
                        {`${
                          (guests.guestAdults || 0) +
                          (guests.guestChildren || 0)
                        } Guests, ${guests.guestInfants || 0} Infants`}
                      </span>
                    </span>
                  </div>
                  <PencilSquareIcon className="w-6 h-6 text-neutral-6000 dark:text-neutral-400" />
                </button>
              )}
            />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold">Thanh toán</h3>
          <div className="w-14 border-b border-neutral-200 dark:border-neutral-700 my-5"></div>

          <div className="mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Thanh toán qua PayOS</strong>
                <br />
                Bạn sẽ được chuyển hướng đến trang thanh toán PayOS để hoàn tất giao dịch.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-line">{error}</p>
              </div>
            )}

            <div className="pt-8">
              <ButtonPrimary
                onClick={handlePayment}
                disabled={loading || !state?.condotelId}
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  "Xác nhận và thanh toán"
                )}
              </ButtonPrimary>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`nc-CheckOutPage ${className}`} data-nc-id="CheckOutPage">
      <main className="container mt-11 mb-24 lg:mb-32 flex flex-col-reverse lg:flex-row">
        <div className="w-full lg:w-3/5 xl:w-2/3 lg:pr-10 ">{renderMain()}</div>
        <div className="hidden lg:block flex-grow">{renderSidebar()}</div>
      </main>
    </div>
  );
};

export default CheckOutPage;
