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
import condotelAPI, { PromotionDTO } from "api/condotel";

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
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  const [condotelDetail, setCondotelDetail] = useState<any>(null);

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

  // Initialize selected promotion from state (if passed from detail page)
  useEffect(() => {
    if (state && (state as any).activePromotionId) {
      const promotionId = (state as any).activePromotionId;
      console.log("🎁 Pre-selecting promotion from state:", promotionId);
      setSelectedPromotionId(promotionId);
    }
  }, [state]);

  // Redirect if no state (user came directly to checkout without selecting condotel)
  useEffect(() => {
    if (!state || !state.condotelId) {
      // Optionally redirect to listing page
      // navigate("/listing-stay");
    }
  }, [state, navigate]);

  // Load condotel detail and promotions
  useEffect(() => {
    const loadCondotelDetail = async () => {
      if (!state?.condotelId) return;
      
      try {
        console.log("🔄 Loading condotel detail for promotions...");
        const detail = await condotelAPI.getById(state.condotelId);
        setCondotelDetail(detail);
        
        console.log("📦 Condotel detail loaded:", detail);
        console.log("🎁 Promotions from detail:", detail.promotions);
        console.log("🎁 ActivePromotion from detail:", detail.activePromotion);
        
        // Load promotions from condotel detail
        let loadedPromotions: PromotionDTO[] = [];
        
        if (detail.promotions && Array.isArray(detail.promotions)) {
          loadedPromotions = detail.promotions;
          console.log("✅ Loaded promotions from detail.promotions:", loadedPromotions.length);
        }
        
        // Also check activePromotion (single promotion)
        if (detail.activePromotion) {
          // Check if it's not already in the list
          const exists = loadedPromotions.some(p => p.promotionId === detail.activePromotion?.promotionId);
          if (!exists) {
            loadedPromotions.push(detail.activePromotion);
            console.log("✅ Added activePromotion to list");
          }
        }
        
        setPromotions(loadedPromotions);
        console.log("🎁 Final promotions list:", loadedPromotions);
        
        // Auto-select promotion if passed from detail page
        if (state && (state as any).activePromotionId) {
          const promotionId = (state as any).activePromotionId;
          const promotionExists = loadedPromotions.some(p => p.promotionId === promotionId);
          if (promotionExists) {
            console.log("✅ Auto-selecting promotion:", promotionId);
            setSelectedPromotionId(promotionId);
          } else {
            console.log("⚠️ Promotion from state not found in loaded promotions");
          }
        }
      } catch (err) {
        console.error("❌ Error loading condotel detail:", err);
      }
    };

    loadCondotelDetail();
  }, [state?.condotelId]);

  // Filter available promotions based on booking dates
  const getAvailablePromotions = (): PromotionDTO[] => {
    if (!rangeDates.startDate || !rangeDates.endDate) {
      console.log("⚠️ No booking dates selected");
      return [];
    }
    
    const startDate = rangeDates.startDate.format("YYYY-MM-DD");
    const endDate = rangeDates.endDate.format("YYYY-MM-DD");
    
    console.log("🔍 Filtering promotions for booking dates:", { startDate, endDate });
    console.log("🔍 Total promotions to filter:", promotions.length);
    
    const available = promotions.filter((promo) => {
      console.log("🔍 Checking promotion:", {
        promotionId: promo.promotionId,
        name: promo.name,
        status: promo.status,
        isActive: promo.isActive,
        startDate: promo.startDate,
        endDate: promo.endDate,
      });
      
      // Check if booking dates overlap with promotion period
      // Promotion is available if booking dates overlap with promotion period
      const promoStart = moment(promo.startDate).format("YYYY-MM-DD");
      const promoEnd = moment(promo.endDate).format("YYYY-MM-DD");
      
      // Check if booking dates overlap with promotion period
      // Booking overlaps if: bookingStart <= promoEnd && bookingEnd >= promoStart
      const overlaps = startDate <= promoEnd && endDate >= promoStart;
      
      if (!overlaps) {
        console.log("❌ Promotion dates don't overlap:", promo.promotionId, {
          bookingStart: startDate,
          bookingEnd: endDate,
          promoStart,
          promoEnd,
        });
        return false;
      }
      
      // Priority: If booking dates are within promotion period, consider it active
      // (Backend might not set isActive/status correctly, but dates are the source of truth)
      const bookingWithinPromotion = startDate >= promoStart && endDate <= promoEnd;
      
      // If booking dates are fully within promotion period, consider it active (regardless of status/isActive)
      if (bookingWithinPromotion) {
        console.log("✅ Promotion dates fully contain booking dates - ACCEPTING:", promo.promotionId, {
          bookingStart: startDate,
          bookingEnd: endDate,
          promoStart,
          promoEnd,
          status: promo.status,
          isActive: promo.isActive,
        });
        return true;
      }
      
      // If dates overlap (but not fully within), still accept if status is Active or dates are current
      // This handles cases where backend doesn't set status correctly
      const today = moment().format("YYYY-MM-DD");
      const isCurrentlyActive = today >= promoStart && today <= promoEnd;
      
      // Accept if:
      // 1. Status is "Active" OR
      // 2. isActive is true OR
      // 3. Status is null/false but dates are current (backend might not set status correctly)
      const isActive = 
        promo.status === "Active" || 
        promo.isActive === true ||
        (isCurrentlyActive); // Accept if dates are current, even if status is not set
      
      if (!isActive) {
        console.log("❌ Promotion not active:", promo.promotionId, {
          status: promo.status,
          isActive: promo.isActive,
          isCurrentlyActive,
          today,
          promoStart,
          promoEnd,
          bookingWithinPromotion,
        });
        return false;
      }
      
      console.log("✅ Promotion is available (overlap check):", promo.promotionId);
      
      console.log("✅ Promotion is available:", promo.promotionId);
      return true;
    });
    
    console.log("✅ Available promotions:", available.length, available);
    return available;
  };

  // Calculate price with promotion
  const calculatePriceWithPromotion = (basePrice: number, promotion: PromotionDTO | null): number => {
    if (!promotion) return basePrice;
    
    if (promotion.discountPercentage) {
      return basePrice * (1 - promotion.discountPercentage / 100);
    } else if (promotion.discountAmount) {
      return Math.max(0, basePrice - promotion.discountAmount);
    }
    
    return basePrice;
  };

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

    // Declare bookingData outside try block so it's accessible in catch block
    let bookingData: CreateBookingDTO | null = null;

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

      // Auto-select promotion if available and not already selected
      const availablePromotions = getAvailablePromotions();
      let finalPromotionId = selectedPromotionId;
      
      if ((!finalPromotionId || finalPromotionId <= 0) && availablePromotions.length > 0) {
        finalPromotionId = availablePromotions[0].promotionId;
        console.log("🎁 Auto-selecting first available promotion for booking:", finalPromotionId);
        setSelectedPromotionId(finalPromotionId);
      }

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
      bookingData = {
        condotelId: state.condotelId!,
        startDate: startDateStr,
        endDate: endDateStr,
        status: "Pending", // Default status for new bookings
        condotelName: condotelName, // Required by backend validation
        promotionId: finalPromotionId && finalPromotionId > 0 ? finalPromotionId : undefined,
      };

      console.log("📤 Creating booking with data:", bookingData);
      console.log("🎁 Available promotions:", availablePromotions.length);
      console.log("🎁 Selected promotion ID (state):", selectedPromotionId);
      console.log("🎁 Final promotion ID (to send):", finalPromotionId);
      console.log("🎁 Promotion will be sent:", bookingData.promotionId);
      console.log("ℹ️ Backend will automatically validate and apply promotion if valid");
      
      if (finalPromotionId) {
        const promo = availablePromotions.find(p => p.promotionId === finalPromotionId);
        console.log("🎁 Promotion details being sent:", {
          promotionId: promo?.promotionId,
          name: promo?.name,
          discountPercentage: promo?.discountPercentage,
          discountAmount: promo?.discountAmount,
          startDate: promo?.startDate,
          endDate: promo?.endDate,
          status: promo?.status,
          isActive: promo?.isActive,
        });
        console.log("ℹ️ Backend validation will check:");
        console.log("  ✓ Promotion belongs to condotel (CondotelId match)");
        console.log("  ✓ Promotion is active (Status = 'Active')");
        console.log("  ✓ Booking dates are within promotion period (StartDate <= booking dates <= EndDate)");
      }
      
      let booking = await bookingAPI.createBooking(bookingData);
      console.log("✅ Booking created:", booking);
      console.log("💰 Booking totalPrice (from backend, already includes promotion discount):", booking.totalPrice);
      console.log("🎁 Booking promotionId:", booking.promotionId);
      
      // Validate bookingId exists
      if (!booking.bookingId) {
        throw new Error("Booking created but BookingId is missing. Please try again.");
      }
      
      // Backend đã tự động validate và áp dụng promotion
      // totalPrice từ backend đã bao gồm discount nếu promotion hợp lệ
      if (finalPromotionId && booking.promotionId !== finalPromotionId) {
        console.warn("⚠️ Promotion ID mismatch:", {
          sent: finalPromotionId,
          received: booking.promotionId,
          message: "Backend có thể đã reject promotion hoặc sử dụng promotion khác"
        });
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
          
          // Check if error is related to promotion
          const errorMessageLower = errorMessage.toLowerCase();
          if (errorMessageLower.includes("promotion") || errorMessageLower.includes("khuyến mãi")) {
            console.warn("⚠️ Promotion validation error from backend:", errorMessage);
            // Có thể promotion không hợp lệ, thử lại không có promotion
            const sentPromotionId = bookingData?.promotionId;
            if (sentPromotionId) {
              console.log("🔄 Promotion was sent but rejected by backend:", sentPromotionId);
              // Có thể hiển thị thông báo và cho user chọn tiếp tục không có promotion
              errorMessage += "\n\nBạn có thể thử lại không sử dụng khuyến mãi.";
            }
          }
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
    const baseTotalPrice = nights * pricePerNight;
    
    // Get available promotions and selected promotion
    const availablePromotions = getAvailablePromotions();
    let selectedPromotion = promotions.find(p => p.promotionId === selectedPromotionId) || null;
    
    // If no promotion selected but there's an available one, use the first available
    if (!selectedPromotion && availablePromotions.length > 0) {
      selectedPromotion = availablePromotions[0];
      // Auto-select it in state if not already selected
      if (!selectedPromotionId || selectedPromotionId !== selectedPromotion.promotionId) {
        console.log("🎁 Auto-selecting first available promotion for display:", selectedPromotion.promotionId);
        setSelectedPromotionId(selectedPromotion.promotionId);
      }
    }
    
    const totalPrice = calculatePriceWithPromotion(baseTotalPrice, selectedPromotion);
    const discountAmount = baseTotalPrice - totalPrice;
    
    console.log("💰 Sidebar price calculation:", {
      baseTotalPrice,
      selectedPromotionId,
      selectedPromotion: selectedPromotion?.promotionId,
      discountPercentage: selectedPromotion?.discountPercentage,
      totalPrice,
      discountAmount,
      availablePromotionsCount: availablePromotions.length,
    });

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
                  <span>{baseTotalPrice.toLocaleString()} đ</span>
                </div>
              )}
              {selectedPromotion && discountAmount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>
                    Giảm giá {selectedPromotion.discountPercentage 
                      ? `(${selectedPromotion.discountPercentage}%)`
                      : selectedPromotion.discountAmount
                      ? `(${selectedPromotion.discountAmount.toLocaleString()} đ)`
                      : ""}
                  </span>
                  <span>-{discountAmount.toLocaleString()} đ</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
                <span>Phí dịch vụ</span>
                <span>0 đ</span>
              </div>

              <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
              <div className="flex justify-between font-semibold">
                <span>Tổng cộng</span>
                <span className={selectedPromotion && discountAmount > 0 ? "text-red-600 dark:text-red-400" : ""}>
                  {totalPrice > 0 ? totalPrice.toLocaleString() : "0"} đ
                </span>
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

        {/* Promotion Selection */}
        {(() => {
          const availablePromotions = getAvailablePromotions();
          console.log("🎁 Rendering promotions section. Available:", availablePromotions.length);
          
          if (availablePromotions.length === 0) {
            console.log("⚠️ No available promotions to display");
            return null;
          }
          
          return (
            <div className="mt-6">
              <h3 className="text-2xl font-semibold mb-4">Khuyến mãi</h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="promotion"
                    checked={selectedPromotionId === null}
                    onChange={() => setSelectedPromotionId(null)}
                    className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Không sử dụng khuyến mãi
                    </span>
                  </div>
                </label>
                {availablePromotions.map((promo) => (
                  <label
                    key={promo.promotionId}
                    className="flex items-start space-x-3 cursor-pointer p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                  >
                    <input
                      type="radio"
                      name="promotion"
                      checked={selectedPromotionId === promo.promotionId}
                      onChange={() => setSelectedPromotionId(promo.promotionId)}
                      className="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {promo.name}
                        </span>
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded">
                          {promo.discountPercentage 
                            ? `-${promo.discountPercentage}%`
                            : promo.discountAmount
                            ? `-${promo.discountAmount.toLocaleString()} đ`
                            : "Khuyến mãi"}
                        </span>
                      </div>
                      {promo.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {promo.description}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                        Áp dụng từ {moment(promo.startDate).format("DD/MM/YYYY")} đến {moment(promo.endDate).format("DD/MM/YYYY")}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })()}
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
