import { PriceDTO, PromotionDTO } from "api/condotel";
import moment from "moment";

/**
 * Tính giá cơ bản dựa trên activePrice và pricePerNight
 * @param pricePerNight - Giá mặc định
 * @param activePrice - Giá đang active (nếu có)
 * @param checkInDate - Ngày check-in (optional, để kiểm tra activePrice có hợp lệ không)
 * @param checkOutDate - Ngày check-out (optional, để kiểm tra activePrice có hợp lệ không)
 * @returns Giá cơ bản để tính toán
 */
export const calculateBasePrice = (
  pricePerNight: number,
  activePrice: PriceDTO | null | undefined,
  checkInDate?: string | moment.Moment,
  checkOutDate?: string | moment.Moment
): number => {
  // Nếu không có activePrice, dùng pricePerNight
  if (!activePrice) {
    return pricePerNight;
  }

  // Nếu có checkInDate và checkOutDate, kiểm tra activePrice có nằm trong thời gian chỉ định không
  if (checkInDate && checkOutDate) {
    const checkIn = moment(checkInDate);
    const checkOut = moment(checkOutDate);
    const priceStart = moment(activePrice.startDate);
    const priceEnd = moment(activePrice.endDate);

    // Kiểm tra xem check-in và check-out có nằm trong khoảng thời gian của activePrice không
    // activePrice hợp lệ nếu check-in và check-out đều nằm trong [startDate, endDate]
    const isPriceValid = 
      (checkIn.isSameOrAfter(priceStart, 'day') && checkIn.isSameOrBefore(priceEnd, 'day')) &&
      (checkOut.isSameOrAfter(priceStart, 'day') && checkOut.isSameOrBefore(priceEnd, 'day'));

    if (isPriceValid) {
      return activePrice.basePrice;
    } else {
      // activePrice không nằm trong thời gian chỉ định, dùng pricePerNight
      return pricePerNight;
    }
  }

  // Nếu không có checkInDate/checkOutDate (như trong listing card), dùng basePrice nếu có activePrice
  return activePrice.basePrice;
};

/**
 * Tính giá sau khi áp dụng promotion
 * @param basePrice - Giá cơ bản (từ calculateBasePrice)
 * @param promotion - Promotion đang active (nếu có)
 * @returns Giá sau khi giảm giá
 */
export const calculatePriceWithPromotion = (
  basePrice: number,
  promotion: PromotionDTO | null | undefined
): number => {
  if (!promotion) {
    return basePrice;
  }

  if (promotion.discountPercentage) {
    // Giảm theo phần trăm
    return basePrice * (1 - promotion.discountPercentage / 100);
  } else if (promotion.discountAmount) {
    // Giảm theo số tiền cố định
    return Math.max(0, basePrice - promotion.discountAmount);
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
  const final = calculatePriceWithPromotion(base, promotion);
  const discount = base - final;

  return {
    basePrice: base,
    finalPrice: final,
    discountAmount: discount,
  };
};

