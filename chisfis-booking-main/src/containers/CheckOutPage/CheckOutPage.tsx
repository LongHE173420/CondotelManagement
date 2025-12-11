import { PencilSquareIcon } from "@heroicons/react/24/outline";
import React, { FC, Fragment, useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Input from "shared/Input/Input";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
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
import bookingAPI, { CreateBookingDTO, ServicePackageBookingItem } from "api/booking";
import paymentAPI from "api/payment";
import condotelAPI, { PromotionDTO } from "api/condotel";
import voucherAPI, { VoucherDTO } from "api/voucher";
import { toastWarning, showValidationError } from "utils/toast";
import servicePackageAPI, { ServicePackageDTO } from "api/servicePackage";
import { calculateFinalPrice } from "utils/priceCalculator";

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
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const state = location.state as CheckoutState | null;
  
  // Get bookingId and retry from query params (for retry payment)
  const retryBookingId = searchParams.get("bookingId");
  const isRetry = searchParams.get("retry") === "true";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);
  const [myVouchers, setMyVouchers] = useState<VoucherDTO[]>([]); // Vouchers của user
  const [condotelVouchers, setCondotelVouchers] = useState<VoucherDTO[]>([]); // Vouchers theo condotel
  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [servicePackages, setServicePackages] = useState<ServicePackageDTO[]>([]);
  const [selectedServicePackages, setSelectedServicePackages] = useState<Set<number>>(new Set()); // serviceId set (checkbox - không có số lượng)
  const [condotelDetail, setCondotelDetail] = useState<any>(null);
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

  // Handle retry payment: if retry=true and bookingId exists, automatically create payment link
  useEffect(() => {
    const handleRetryPayment = async () => {
      if (!isRetry || !retryBookingId || !user) {
        return;
      }

      const bookingIdNum = parseInt(retryBookingId);
      if (isNaN(bookingIdNum)) {
        setError("Booking ID không hợp lệ");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🔄 Retrying payment for booking:", bookingIdNum);
        
        // Fetch booking details
        const booking = await bookingAPI.getBookingById(bookingIdNum);
        
        // Validate booking has totalPrice
        if (!booking.totalPrice || booking.totalPrice <= 0) {
          throw new Error("Booking không có tổng tiền hợp lệ để thanh toán");
        }

        // Create payment link
        const returnUrl = `${window.location.origin}/pay-done?bookingId=${booking.bookingId}&status=success`;
        const cancelUrl = `${window.location.origin}/payment/cancel?bookingId=${booking.bookingId}&status=cancelled`;

        const bookingIdStr = String(booking.bookingId);
        let description: string;
        const bookingPrefix = "Booking #";
        if (bookingPrefix.length + bookingIdStr.length <= 25) {
          description = `${bookingPrefix}${bookingIdStr}`;
        } else {
          const hashPrefix = "#";
          if (hashPrefix.length + bookingIdStr.length <= 25) {
            description = `${hashPrefix}${bookingIdStr}`;
          } else {
            const maxIdLength = 25 - hashPrefix.length;
            description = `${hashPrefix}${bookingIdStr.substring(0, maxIdLength)}`;
          }
        }
        description = description.substring(0, 25);

        console.log("📤 Creating payment link for retry payment...");
        const paymentResponse = await paymentAPI.createPayment({
          bookingId: booking.bookingId,
          description: description,
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
        });

        if (paymentResponse.data?.checkoutUrl) {
          console.log("✅ Payment link created, redirecting to PayOS...");
          // Redirect to PayOS checkout
          window.location.href = paymentResponse.data.checkoutUrl;
        } else {
          throw new Error(paymentResponse.desc || "Không thể tạo link thanh toán");
        }
      } catch (err: any) {
        console.error("❌ Retry payment error:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Không thể tạo link thanh toán. Vui lòng thử lại."
        );
        setLoading(false);
      }
    };

    handleRetryPayment();
  }, [isRetry, retryBookingId, user]);

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

        // Load vouchers: cả vouchers của user và vouchers theo condotel
        try {
          const now = new Date();
          const allVouchers: VoucherDTO[] = [];
          let myVouchersList: VoucherDTO[] = [];
          let condotelVouchersList: VoucherDTO[] = [];
          
          // 1. Load vouchers của user hiện tại (nếu đã đăng nhập)
          if (user) {
            try {
              console.log("🎫 Loading my vouchers...");
              const myVouchers = await voucherAPI.getMyVouchers();
              // Filter: chỉ lấy voucher active và chưa hết hạn
              const activeMyVouchers = myVouchers.filter(v => {
                if (!v.isActive) return false;
                const endDate = new Date(v.endDate);
                const startDate = new Date(v.startDate);
                return startDate <= now && endDate >= now;
              });
              myVouchersList = activeMyVouchers;
              allVouchers.push(...activeMyVouchers);
              console.log("🎫 My vouchers:", activeMyVouchers.length);
            } catch (myVoucherErr) {
              console.warn("⚠️ Error loading my vouchers:", myVoucherErr);
              // Không block nếu không load được my vouchers
            }
          }
          
          // 2. Load vouchers theo condotel
          try {
            console.log("🎫 Loading vouchers for condotel:", state.condotelId);
            const condotelVouchers = await voucherAPI.getByCondotel(state.condotelId);
            // Filter: chỉ lấy voucher active và chưa hết hạn
            const activeCondotelVouchers = condotelVouchers.filter(v => {
              if (!v.isActive) return false;
              const endDate = new Date(v.endDate);
              const startDate = new Date(v.startDate);
              return startDate <= now && endDate >= now;
            });
            condotelVouchersList = activeCondotelVouchers;
            allVouchers.push(...activeCondotelVouchers);
            console.log("🎫 Condotel vouchers:", activeCondotelVouchers.length);
          } catch (condotelVoucherErr) {
            console.warn("⚠️ Error loading condotel vouchers:", condotelVoucherErr);
            // Không block nếu không load được condotel vouchers
          }
          
          // 3. Loại bỏ trùng lặp (theo voucherId)
          const uniqueVouchers = Array.from(
            new Map(allVouchers.map(v => [v.voucherId, v])).values()
          );
          
          setMyVouchers(myVouchersList);
          setCondotelVouchers(condotelVouchersList);
          setVouchers(uniqueVouchers);
          console.log("🎫 Total available vouchers:", uniqueVouchers.length);
        } catch (voucherErr) {
          console.error("❌ Error loading vouchers:", voucherErr);
          setVouchers([]);
          setMyVouchers([]);
          setCondotelVouchers([]);
        }

        // Load service packages available for this condotel
        try {
          console.log("📦 Loading service packages for condotel:", state.condotelId);
          const condotelServicePackages = await servicePackageAPI.getByCondotel(state.condotelId);
          // Filter: chỉ lấy service packages active
          const activeServicePackages = condotelServicePackages.filter(sp => {
            return (sp.isActive !== false) && (sp.status === "Active" || !sp.status);
          });
          setServicePackages(activeServicePackages);
          console.log("📦 Available service packages:", activeServicePackages.length);
        } catch (serviceErr) {
          console.error("Error loading service packages:", serviceErr);
          setServicePackages([]);
        }
      } catch (err) {
        console.error("❌ Error loading condotel detail:", err);
      }
    };

    loadCondotelDetail();
  }, [state?.condotelId]);

  // Load vouchers when condotelId changes
  useEffect(() => {
    const loadVouchers = async () => {
      if (!state?.condotelId) {
        setVouchers([]);
        setMyVouchers([]);
        setCondotelVouchers([]);
        return;
      }

      try {
        // Chỉ load vouchers theo condotel (backend đã validate và filter)
        // Backend GetByCondotelAsync chỉ trả về voucher:
        // - Status = "Active"
        // - EndDate >= today
        // - Sắp xếp theo EndDate
        console.log("🎫 Loading vouchers for condotel:", state.condotelId);
        const condotelVouchers = await voucherAPI.getByCondotel(state.condotelId);
        
        // Filter thêm ở frontend để đảm bảo (backend đã filter rồi nhưng double-check)
        const now = new Date();
        const validCondotelVouchers = condotelVouchers.filter(v => {
          if (!v.isActive) return false;
          const endDate = new Date(v.endDate);
          const startDate = new Date(v.startDate);
          // Validate condotelId phải khớp
          const voucherCondotelId = (v as any).condotelId;
          if (!voucherCondotelId || voucherCondotelId !== state.condotelId) return false;
          return startDate <= now && endDate >= now;
        });
        
        // Load vouchers của user và filter chỉ lấy voucher có condotelId khớp
        let myVouchersList: VoucherDTO[] = [];
        if (user) {
          try {
            console.log("🎫 Loading my vouchers...");
            const myVouchers = await voucherAPI.getMyVouchers();
            // Filter: chỉ lấy voucher active, còn hiệu lực, và có condotelId khớp
            const activeMyVouchers = myVouchers.filter(v => {
              if (!v.isActive) return false;
              const endDate = new Date(v.endDate);
              const startDate = new Date(v.startDate);
              if (startDate > now || endDate < now) return false;
              // Validate condotelId phải khớp với condotel đang booking
              const voucherCondotelId = (v as any).condotelId;
              if (!voucherCondotelId || voucherCondotelId !== state.condotelId) return false;
              return true;
            });
            myVouchersList = activeMyVouchers;
            console.log("🎫 My vouchers for this condotel:", activeMyVouchers.length);
          } catch (myVoucherErr) {
            console.warn("⚠️ Error loading my vouchers:", myVoucherErr);
            // Không block nếu không load được my vouchers
          }
        }
        
        // Kết hợp và loại bỏ trùng lặp
        const allVouchers = [...validCondotelVouchers, ...myVouchersList];
        const uniqueVouchers = Array.from(
          new Map(allVouchers.map(v => [v.voucherId, v])).values()
        );
        
        setMyVouchers(myVouchersList);
        setCondotelVouchers(validCondotelVouchers);
        setVouchers(uniqueVouchers);
        console.log("🎫 Total available vouchers:", uniqueVouchers.length);
      } catch (voucherErr) {
        console.error("❌ Error loading vouchers:", voucherErr);
        setVouchers([]);
        setMyVouchers([]);
        setCondotelVouchers([]);
      }
    };

    loadVouchers();
  }, [state?.condotelId, user]);

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

  // Calculate price with both promotion and voucher (voucher applied after promotion)
  const calculatePriceWithPromotionAndVoucher = (
    basePrice: number, 
    promotion: PromotionDTO | null,
    voucher: VoucherDTO | null
  ): number => {
    // Step 1: Apply promotion first
    let priceAfterPromotion = calculatePriceWithPromotion(basePrice, promotion);
    
    // Step 2: Apply voucher discount (after promotion)
    if (!voucher) return priceAfterPromotion;
    
    if (voucher.discountPercentage) {
      return Math.max(0, priceAfterPromotion * (1 - voucher.discountPercentage / 100));
    }
    
    if (voucher.discountAmount) {
      return Math.max(0, priceAfterPromotion - voucher.discountAmount);
    }
    
    return priceAfterPromotion;
  };

  // Calculate service packages total (mỗi service chỉ tính 1 lần vì dùng checkbox)
  const calculateServicePackagesTotal = (): number => {
    let total = 0;
    selectedServicePackages.forEach((serviceId) => {
      const servicePackage = servicePackages.find(sp => 
        (sp.serviceId === serviceId) || (sp.servicePackageId === serviceId) || (sp.packageId === serviceId)
      );
      if (servicePackage) {
        total += servicePackage.price; // Mỗi service chỉ tính 1 lần
      }
    });
    return total;
  };

  // Handle service package toggle (checkbox - chọn/bỏ chọn)
  const handleServicePackageToggle = (serviceId: number) => {
    const newSet = new Set(selectedServicePackages);
    if (newSet.has(serviceId)) {
      newSet.delete(serviceId); // Bỏ chọn
    } else {
      newSet.add(serviceId); // Chọn
    }
    setSelectedServicePackages(newSet);
  };

  // Get selected voucher object
  const getSelectedVoucher = (): VoucherDTO | null => {
    if (!selectedVoucherCode || !state?.condotelId) return null;
    const voucher = vouchers.find(v => v.code === selectedVoucherCode);
    if (!voucher) return null;
    
    // Validate: Voucher phải có condotelId và khớp với condotel đang booking
    const voucherCondotelId = (voucher as any).condotelId;
    if (voucherCondotelId && voucherCondotelId !== state.condotelId) {
      setVoucherError("Voucher này không áp dụng cho condotel này");
      setSelectedVoucherCode(null);
      return null;
    }
    
    return voucher;
  };

  // Handle voucher code input and validation
  const handleApplyVoucher = () => {
    if (!voucherInput.trim()) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }

    if (!state?.condotelId) {
      setVoucherError("Vui lòng chọn condotel trước");
      return;
    }

    const voucher = vouchers.find(v => v.code.toUpperCase() === voucherInput.trim().toUpperCase());
    if (!voucher) {
      setVoucherError("Mã voucher không hợp lệ hoặc không áp dụng cho condotel này");
      return;
    }
    
    // Validate: Voucher phải có condotelId và khớp với condotel đang booking
    const voucherCondotelId = (voucher as any).condotelId;
    if (!voucherCondotelId || voucherCondotelId <= 0) {
      setVoucherError("Voucher không hợp lệ (thiếu thông tin condotel)");
      return;
    }
    
    if (voucherCondotelId !== state.condotelId) {
      setVoucherError("Voucher này không áp dụng cho condotel này");
      return;
    }
    
    setSelectedVoucherCode(voucher.code);
    setVoucherError(null);
    setVoucherInput("");
  };

  // Handle payment
  const handlePayment = async () => {
    if (!user) {
      toastWarning("Vui lòng đăng nhập để đặt phòng");
      navigate("/login");
      return;
    }

    if (!state?.condotelId) {
      showValidationError("Vui lòng chọn căn hộ để đặt phòng");
      return;
    }

    if (!rangeDates.startDate || !rangeDates.endDate) {
      showValidationError("Vui lòng chọn ngày check-in và check-out");
      return;
    }

    const nights = rangeDates.endDate.diff(rangeDates.startDate, "days");
    if (nights <= 0) {
      showValidationError("Ngày check-out phải sau ngày check-in");
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

      // Prepare service packages for booking (quantity luôn là 1 vì dùng checkbox)
      const servicePackagesForBooking: ServicePackageBookingItem[] = [];
      selectedServicePackages.forEach((serviceId) => {
        servicePackagesForBooking.push({
          serviceId: serviceId,
          quantity: 1, // Luôn là 1 vì dùng checkbox
        });
      });

      // Step 1: Tạo booking
      bookingData = {
        condotelId: state.condotelId!,
        startDate: startDateStr,
        endDate: endDateStr,
        status: "Pending", // Default status for new bookings
        condotelName: condotelName, // Required by backend validation
        promotionId: finalPromotionId && finalPromotionId > 0 ? finalPromotionId : undefined,
        voucherCode: selectedVoucherCode || undefined, // Voucher code (backend will validate)
        servicePackages: servicePackagesForBooking.length > 0 ? servicePackagesForBooking : undefined,
      };

      console.log("📤 Creating booking with data:", bookingData);
      console.log("🎁 Available promotions:", availablePromotions.length);
      console.log("🎁 Selected promotion ID (state):", selectedPromotionId);
      console.log("🎁 Final promotion ID (to send):", finalPromotionId);
      console.log("🎁 Promotion will be sent:", bookingData.promotionId);
      console.log("🎫 Voucher code will be sent:", bookingData.voucherCode || "None");
      console.log("📦 Service packages will be sent:", servicePackagesForBooking.length);
      console.log("ℹ️ Backend will automatically validate and apply promotion + voucher + service packages if valid");
      
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
          
          // Check if error is related to promotion or voucher
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
          } else if (errorMessageLower.includes("voucher") || errorMessageLower.includes("mã giảm giá")) {
            console.warn("⚠️ Voucher validation error from backend:", errorMessage);
            // Voucher không hợp lệ, xóa voucher đã chọn
            setSelectedVoucherCode(null);
            setVoucherError(errorMessage);
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
    
    // Get base price per night: từ activePrice nếu có và nằm trong thời gian, nếu không thì từ pricePerNight
    const pricePerNight = state?.pricePerNight || 0;
    const checkInDate = rangeDates.startDate;
    const checkOutDate = rangeDates.endDate;
    
    // Tính giá cơ bản cho 1 đêm (có thể từ activePrice hoặc pricePerNight)
    const { basePrice: basePricePerNight } = calculateFinalPrice(
      pricePerNight,
      condotelDetail?.activePrice || null,
      null, // Chưa áp dụng promotion ở đây, sẽ áp dụng sau
      checkInDate || undefined,
      checkOutDate || undefined
    );
    
    const baseTotalPrice = nights * basePricePerNight;
    
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
    
    // Calculate with both promotion and voucher
    const selectedVoucher = getSelectedVoucher();
    const priceAfterPromotionAndVoucher = calculatePriceWithPromotionAndVoucher(baseTotalPrice, selectedPromotion, selectedVoucher);
    
    // Calculate service packages total
    const servicePackagesTotal = calculateServicePackagesTotal();
    
    // Final total = price after discounts + service packages
    const totalPrice = priceAfterPromotionAndVoucher + servicePackagesTotal;
    
    // Calculate discounts separately for display
    const priceAfterPromotion = calculatePriceWithPromotion(baseTotalPrice, selectedPromotion);
    const promotionDiscount = baseTotalPrice - priceAfterPromotion;
    const voucherDiscount = selectedVoucher ? (priceAfterPromotion - priceAfterPromotionAndVoucher) : 0;
    const totalDiscount = promotionDiscount + voucherDiscount;
    
    console.log("💰 Sidebar price calculation:", {
      pricePerNight: state?.pricePerNight,
      activePrice: condotelDetail?.activePrice,
      basePricePerNight,
      checkInDate: checkInDate?.format("YYYY-MM-DD"),
      checkOutDate: checkOutDate?.format("YYYY-MM-DD"),
      nights,
      baseTotalPrice,
      selectedPromotionId,
      selectedPromotion: selectedPromotion?.promotionId,
      discountPercentage: selectedPromotion?.discountPercentage,
      totalPrice,
      promotionDiscount,
      voucherDiscount,
      totalDiscount,
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
              {nights > 0 && basePricePerNight > 0 && (
                <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
                  <span>{Math.round(basePricePerNight).toLocaleString()} đ x {nights} đêm</span>
                  <span>{baseTotalPrice.toLocaleString()} đ</span>
                </div>
              )}
              {selectedPromotion && promotionDiscount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>
                    Giảm giá khuyến mãi {selectedPromotion.discountPercentage 
                      ? `(${selectedPromotion.discountPercentage}%)`
                      : selectedPromotion.discountAmount
                      ? `(${selectedPromotion.discountAmount.toLocaleString()} đ)`
                      : ""}
                  </span>
                  <span>-{promotionDiscount.toLocaleString()} đ</span>
                </div>
              )}
              {selectedVoucher && voucherDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>
                    Giảm giá voucher {selectedVoucher.discountPercentage 
                      ? `(${selectedVoucher.discountPercentage}%)`
                      : selectedVoucher.discountAmount
                      ? `(${selectedVoucher.discountAmount.toLocaleString()} đ)`
                      : ""}
                  </span>
                  <span>-{voucherDiscount.toLocaleString()} đ</span>
                </div>
              )}
              {servicePackagesTotal > 0 && (
                <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
                  <span>Dịch vụ bổ sung</span>
                  <span>+{servicePackagesTotal.toLocaleString()} đ</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-6000 dark:text-neutral-300">
                <span>Phí dịch vụ</span>
                <span>0 đ</span>
              </div>

              <div className="border-b border-neutral-200 dark:border-neutral-700"></div>
              <div className="flex justify-between font-semibold">
                <span>Tổng cộng</span>
                <span className={totalDiscount > 0 ? "text-red-600 dark:text-red-400" : ""}>
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

        {/* Voucher Section */}
        <div className="mt-6">
          <h3 className="text-2xl font-semibold mb-4">Voucher</h3>
          
          {/* Voucher Input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nhập mã voucher"
                value={voucherInput}
                onChange={(e) => {
                  setVoucherInput(e.target.value);
                  setVoucherError(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleApplyVoucher();
                  }
                }}
                className="flex-1"
              />
              <ButtonSecondary
                type="button"
                onClick={handleApplyVoucher}
                disabled={!voucherInput.trim()}
              >
                Áp dụng
              </ButtonSecondary>
            </div>
            
            {voucherError && (
              <p className="text-sm text-red-600 dark:text-red-400">{voucherError}</p>
            )}
            
            {getSelectedVoucher() && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      {getSelectedVoucher()?.code}
                    </p>
                    {getSelectedVoucher()?.description && (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {getSelectedVoucher()?.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVoucherCode(null);
                      setVoucherError(null);
                    }}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Vouchers */}
          {vouchers.length > 0 && !getSelectedVoucher() && (
            <div className="mt-4 space-y-4">
              {/* Vouchers của tôi */}
              {myVouchers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Voucher của tôi:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myVouchers.slice(0, 4).map((voucher) => (
                      <button
                        key={voucher.voucherId}
                        type="button"
                        onClick={() => {
                          setSelectedVoucherCode(voucher.code);
                          setVoucherError(null);
                        }}
                        className="p-3 border-2 border-primary-500 dark:border-primary-400 rounded-lg hover:border-primary-600 dark:hover:border-primary-300 transition-colors text-left bg-primary-50 dark:bg-primary-900/20"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                            {voucher.code}
                          </span>
                          {voucher.discountPercentage ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold rounded">
                              -{voucher.discountPercentage}%
                            </span>
                          ) : voucher.discountAmount ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold rounded">
                              -{voucher.discountAmount.toLocaleString()}đ
                            </span>
                          ) : null}
                        </div>
                        {voucher.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {voucher.description}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          HSD: {moment(voucher.endDate).format("DD/MM/YYYY")}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Voucher gợi ý theo condotel */}
              {condotelVouchers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Voucher gợi ý cho condotel này:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {condotelVouchers.slice(0, 4).map((voucher) => (
                      <button
                        key={voucher.voucherId}
                        type="button"
                        onClick={() => {
                          setSelectedVoucherCode(voucher.code);
                          setVoucherError(null);
                        }}
                        className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                            {voucher.code}
                          </span>
                          {voucher.discountPercentage ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold rounded">
                              -{voucher.discountPercentage}%
                            </span>
                          ) : voucher.discountAmount ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold rounded">
                              -{voucher.discountAmount.toLocaleString()}đ
                            </span>
                          ) : null}
                        </div>
                        {voucher.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {voucher.description}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          HSD: {moment(voucher.endDate).format("DD/MM/YYYY")}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Service Packages Section */}
        {servicePackages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-2xl font-semibold mb-4">Dịch vụ bổ sung</h3>
            <div className="space-y-4">
              {servicePackages.map((servicePackage) => {
                const serviceId = servicePackage.serviceId || servicePackage.servicePackageId || servicePackage.packageId || 0;
                const isSelected = selectedServicePackages.has(serviceId);

                return (
                  <div
                    key={serviceId}
                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600"
                    }`}
                    onClick={() => handleServicePackageToggle(serviceId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Checkbox */}
                        <div className="flex items-center mt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleServicePackageToggle(serviceId)}
                            onClick={(e) => e.stopPropagation()} // Prevent double toggle
                            className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {servicePackage.name}
                          </h4>
                          {servicePackage.description && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                              {servicePackage.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className={`font-semibold ${
                          isSelected 
                            ? "text-primary-600 dark:text-primary-400" 
                            : "text-neutral-900 dark:text-neutral-100"
                        }`}>
                          {servicePackage.price.toLocaleString()} đ
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedServicePackages.size > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tổng dịch vụ:</strong> {calculateServicePackagesTotal().toLocaleString()} đ
                </p>
              </div>
            )}
          </div>
        )}

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
