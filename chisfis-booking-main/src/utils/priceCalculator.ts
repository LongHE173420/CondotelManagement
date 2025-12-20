import { PriceDTO, PromotionDTO } from "api/condotel";
import moment from "moment";

/**
 * Kiểm tra xem activePrice có đang active tại thời điểm hiện tại hoặc trong khoảng thời gian chỉ định không
 * @param activePrice - Giá đang active (nếu có)
 * @param checkDate - Ngày để kiểm tra (optional, nếu không có thì dùng thời điểm hiện tại)
 * @returns true nếu activePrice đang active
 */
const isPriceActive = (
  activePrice: PriceDTO | null | undefined,
  checkDate?: string | moment.Moment
): boolean => {
  if (!activePrice || !activePrice.startDate || !activePrice.endDate) {
    return false;
  }

  const priceStart = moment(activePrice.startDate);
  const priceEnd = moment(activePrice.endDate);
  const check = checkDate ? moment(checkDate) : moment();

  // Kiểm tra xem checkDate có nằm trong khoảng thời gian của activePrice không
  return check.isSameOrAfter(priceStart, 'day') && check.isSameOrBefore(priceEnd, 'day');
};

/**
 * Tính giá cơ bản dựa trên activePrice và pricePerNight
 * Logic đơn giản: Nếu có activePrice (không null) thì dùng activePrice.basePrice, không thì dùng pricePerNight
 * @param pricePerNight - Giá mặc định
 * @param activePrice - Giá đang active (nếu có)
 * @param checkInDate - Ngày check-in (optional, không sử dụng trong logic hiện tại)
 * @param checkOutDate - Ngày check-out (optional, không sử dụng trong logic hiện tại)
 * @returns Giá cơ bản để tính toán
 */
export const calculateBasePrice = (
  pricePerNight: number,
  activePrice: PriceDTO | null | undefined,
  checkInDate?: string | moment.Moment,
  checkOutDate?: string | moment.Moment
): number => {
  // Logic đơn giản: Nếu có activePrice (không null) thì dùng activePrice.basePrice
  // Không cần kiểm tra thời gian vì backend đã xử lý logic activePrice
  if (activePrice && activePrice.basePrice !== undefined && activePrice.basePrice !== null) {
    return activePrice.basePrice;
  }

  // Nếu không có activePrice hoặc activePrice.basePrice không hợp lệ, dùng pricePerNight
  return pricePerNight;
};

/**
 * Kiểm tra xem promotion có đang active tại thời điểm hiện tại hoặc trong khoảng thời gian chỉ định không
 * @param promotion - Promotion đang active (nếu có)
 * @param checkDate - Ngày để kiểm tra (optional, nếu không có thì dùng thời điểm hiện tại)
 * @returns true nếu promotion đang active
 */
const isPromotionActive = (
  promotion: PromotionDTO | null | undefined,
  checkDate?: string | moment.Moment
): boolean => {
  if (!promotion) {
    return false;
  }

  // Kiểm tra có discount không (phải có discountPercentage hoặc discountAmount > 0)
  const hasDiscount = (promotion.discountPercentage !== undefined && 
                      promotion.discountPercentage !== null && 
                      promotion.discountPercentage > 0) ||
                     (promotion.discountAmount !== undefined && 
                      promotion.discountAmount !== null && 
                      promotion.discountAmount > 0);
  
  if (!hasDiscount) {
    return false;
  }

  // Nếu không có startDate và endDate, nhưng có discount, vẫn cho phép (backend đã xác nhận)
  if (!promotion.startDate || !promotion.endDate) {
    return true;
  }

  // Kiểm tra dates
  const promoStart = moment(promotion.startDate);
  const promoEnd = moment(promotion.endDate);
  const check = checkDate ? moment(checkDate) : moment();

  // Kiểm tra xem checkDate có nằm trong khoảng thời gian của promotion không
  const isWithinDateRange = check.isSameOrAfter(promoStart, 'day') && check.isSameOrBefore(promoEnd, 'day');

  // Nếu có discount và dates hợp lệ, cho phép (bỏ qua status/isActive)
  // Nếu dates không hợp lệ nhưng có discount, vẫn cho phép (backend đã xác nhận)
  if (hasDiscount) {
    if (isWithinDateRange) {
      return true;
    } else {
      // Vẫn cho phép nếu có discount (backend đã xác nhận promotion active)
      return true;
    }
  }

  return false;
};

/**
 * Tính giá sau khi áp dụng promotion
 * @param basePrice - Giá cơ bản (từ calculateBasePrice)
 * @param promotion - Promotion đang active (nếu có)
 * @param checkDate - Ngày để kiểm tra promotion (optional, nếu không có thì dùng thời điểm hiện tại)
 * @returns Giá sau khi giảm giá
 */
export const calculatePriceWithPromotion = (
  basePrice: number,
  promotion: PromotionDTO | null | undefined,
  checkDate?: string | moment.Moment
): number => {
  // Kiểm tra promotion có đang active không
  if (!isPromotionActive(promotion, checkDate)) {
    return basePrice;
  }

  if (promotion!.discountPercentage) {
    // Giảm theo phần trăm
    return basePrice * (1 - promotion!.discountPercentage / 100);
  } else if (promotion!.discountAmount) {
    // Giảm theo số tiền cố định
    return Math.max(0, basePrice - promotion!.discountAmount);
  }

  return basePrice;
};

/**
 * Tính giá cuối cùng (basePrice + promotion)
 * @param pricePerNight - Giá mặc định
 * @param activePrice - Giá đang active (nếu có)
 * @param promotion - Promotion đang active (nếu có)
 * @param checkInDate - Ngày check-in (optional)
 * @param checkOutDate - Ngày check-out (optional)
 * @returns Object chứa basePrice, finalPrice, và discountAmount
 */
export const calculateFinalPrice = (
  pricePerNight: number,
  activePrice: PriceDTO | null | undefined,
  promotion: PromotionDTO | null | undefined,
  checkInDate?: string | moment.Moment,
  checkOutDate?: string | moment.Moment
): {
  basePrice: number;
  finalPrice: number;
  discountAmount: number;
} => {
  const base = calculateBasePrice(pricePerNight, activePrice, checkInDate, checkOutDate);
  
  // Nếu có checkInDate, dùng checkInDate để kiểm tra promotion, nếu không thì dùng thời điểm hiện tại
  const checkDate = checkInDate || undefined;
  const final = calculatePriceWithPromotion(base, promotion, checkDate);
  const discount = base - final;

  return {
    basePrice: base,
    finalPrice: final,
    discountAmount: discount,
  };
};

